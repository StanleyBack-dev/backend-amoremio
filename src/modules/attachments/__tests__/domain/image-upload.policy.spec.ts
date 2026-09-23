import { AppException } from "@/common/exceptions/app-exception";
import { AttachmentOwnerType } from "@/modules/attachments/domain/enums/attachment-owner-type.enum";
import {
  IMAGE_UPLOAD_RULES,
  assertDeclaredUpload,
  assertImageDimensions,
  assertImageSignature,
  detectImageMime,
  sanitizeFileName,
} from "@/modules/attachments/domain/policies/image-upload.policy";
import {
  assertCompleteOrder,
  moveToFront,
} from "@/modules/attachments/domain/services/attachment-ordering";
import {
  buildFinalKey,
  buildTemporaryKey,
  buildThumbnailKey,
} from "@/modules/attachments/domain/services/attachment-storage-keys";

function codeOf(fn: () => unknown): string | undefined {
  try {
    fn();
    return undefined;
  } catch (error) {
    expect(error).toBeInstanceOf(AppException);
    return ((error as AppException).getResponse() as { code: string }).code;
  }
}

const JPEG = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0, 0x10]);
const PNG = Uint8Array.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0,
]);
const WEBP = Uint8Array.from(
  Buffer.from("RIFF\u0000\u0000\u0000\u0000WEBPVP8 "),
);

describe("image upload policy", () => {
  describe("assertDeclaredUpload", () => {
    it("accepts jpeg, png and webp with a matching extension", () => {
      expect(
        assertDeclaredUpload({
          fileName: "Bolo.JPG",
          mimeType: "IMAGE/JPEG",
          sizeBytes: 1000,
        }),
      ).toEqual({
        originalName: "Bolo.JPG",
        mimeType: "image/jpeg",
        sizeBytes: 1000,
      });
      expect(() =>
        assertDeclaredUpload({
          fileName: "a.png",
          mimeType: "image/png",
          sizeBytes: 1,
        }),
      ).not.toThrow();
      expect(() =>
        assertDeclaredUpload({
          fileName: "a.webp",
          mimeType: "image/webp",
          sizeBytes: 1,
        }),
      ).not.toThrow();
    });

    it.each([
      ["svg", "logo.svg", "image/svg+xml"],
      ["gif", "a.gif", "image/gif"],
      ["heic", "a.heic", "image/heic"],
      ["mismatched extension", "a.png", "image/jpeg"],
      ["double extension", "a.png.exe", "image/png"],
      ["no extension", "imagem", "image/png"],
    ])("rejects %s", (_label, fileName, mimeType) => {
      expect(
        codeOf(() =>
          assertDeclaredUpload({ fileName, mimeType, sizeBytes: 10 }),
        ),
      ).toBe("ATTACHMENT_UNSUPPORTED_TYPE");
    });

    it("rejects files above 5 MB and empty files", () => {
      expect(
        codeOf(() =>
          assertDeclaredUpload({
            fileName: "a.png",
            mimeType: "image/png",
            sizeBytes: IMAGE_UPLOAD_RULES.maxBytes + 1,
          }),
        ),
      ).toBe("ATTACHMENT_FILE_TOO_LARGE");
      expect(
        codeOf(() =>
          assertDeclaredUpload({
            fileName: "a.png",
            mimeType: "image/png",
            sizeBytes: 0,
          }),
        ),
      ).toBe("ATTACHMENT_FILE_EMPTY");
    });

    it("accepts exactly 5 MB", () => {
      expect(IMAGE_UPLOAD_RULES.maxBytes).toBe(5 * 1024 * 1024);
      expect(() =>
        assertDeclaredUpload({
          fileName: "a.png",
          mimeType: "image/png",
          sizeBytes: IMAGE_UPLOAD_RULES.maxBytes,
        }),
      ).not.toThrow();
    });
  });

  it("sanitizes file names: strips paths and control characters, bounds length", () => {
    expect(sanitizeFileName("../../etc/passwd.png")).toBe("passwd.png");
    expect(sanitizeFileName("C:\\fotos\\bolo<script>.png")).toBe(
      "boloscript.png",
    );
    expect(sanitizeFileName("a\u0000b.png")).toBe("ab.png");
    expect(sanitizeFileName("")).toBe("imagem");
    expect(sanitizeFileName(`${"x".repeat(300)}.png`)).toHaveLength(
      IMAGE_UPLOAD_RULES.maxFileNameLength,
    );
  });

  it("detects the real format from magic bytes", () => {
    expect(detectImageMime(JPEG)).toBe("image/jpeg");
    expect(detectImageMime(PNG)).toBe("image/png");
    expect(detectImageMime(WEBP)).toBe("image/webp");
    expect(detectImageMime(Buffer.from("<svg xmlns="))).toBeNull();
    expect(detectImageMime(Buffer.from("GIF89a"))).toBeNull();
    expect(detectImageMime(new Uint8Array())).toBeNull();
    expect(
      codeOf(() => assertImageSignature(Buffer.from("MZ executable"))),
    ).toBe("ATTACHMENT_INVALID_IMAGE");
  });

  it("bounds image dimensions and total pixels", () => {
    expect(() => assertImageDimensions(1200, 800)).not.toThrow();
    expect(codeOf(() => assertImageDimensions(50, 800))).toBe(
      "ATTACHMENT_INVALID_DIMENSIONS",
    );
    expect(codeOf(() => assertImageDimensions(12000, 800))).toBe(
      "ATTACHMENT_INVALID_DIMENSIONS",
    );
    // 8000x8000 = 64 MP: each side is allowed, the total is not.
    expect(codeOf(() => assertImageDimensions(8000, 8000))).toBe(
      "ATTACHMENT_INVALID_DIMENSIONS",
    );
  });
});

describe("attachment storage keys", () => {
  const parts = {
    idStore: "s1",
    ownerType: AttachmentOwnerType.PRODUCT,
    ownerId: "p1",
    idAttachment: "a1",
  };

  it("scopes every key under the store and uses server ids only", () => {
    expect(buildTemporaryKey(parts)).toBe("tmp/s1/a1");
    expect(buildFinalKey(parts)).toBe("stores/s1/product/p1/a1.webp");
    expect(buildThumbnailKey(parts)).toBe("stores/s1/product/p1/a1_thumb.webp");
  });
});

describe("attachment ordering", () => {
  it("requires the new order to contain every current id exactly once", () => {
    expect(() => assertCompleteOrder(["a", "b"], ["b", "a"])).not.toThrow();
    expect(codeOf(() => assertCompleteOrder(["a", "b"], ["a"]))).toBe(
      "ATTACHMENT_INVALID_ORDER",
    );
    expect(codeOf(() => assertCompleteOrder(["a", "b"], ["a", "a"]))).toBe(
      "ATTACHMENT_INVALID_ORDER",
    );
    expect(codeOf(() => assertCompleteOrder(["a", "b"], ["a", "c"]))).toBe(
      "ATTACHMENT_INVALID_ORDER",
    );
  });

  it("moves the chosen cover to the front", () => {
    expect(moveToFront(["a", "b", "c"], "c")).toEqual(["c", "a", "b"]);
    expect(codeOf(() => moveToFront(["a"], "z"))).toBe("ATTACHMENT_NOT_FOUND");
  });
});
