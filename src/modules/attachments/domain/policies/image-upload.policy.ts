import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";

export type ImageMimeType = "image/jpeg" | "image/png" | "image/webp";

// SVG is deliberately absent: it is XML that can carry scripts. GIF/HEIC/AVIF
// are out of scope for now; adding one means a mime entry, its magic bytes
// below and confirming the image processor can decode it.
const EXTENSIONS_BY_MIME: Record<ImageMimeType, readonly string[]> = {
  "image/jpeg": ["jpg", "jpeg"],
  "image/png": ["png"],
  "image/webp": ["webp"],
};

export const IMAGE_UPLOAD_RULES = {
  maxBytes: 5 * 1024 * 1024,
  minDimension: 100,
  maxDimension: 10_000,
  // Guards against decompression bombs: a tiny file that decodes into a
  // gigantic bitmap. 40 MP comfortably covers any phone camera.
  maxInputPixels: 40_000_000,
  // Normalized output: every stored image is re-encoded as WebP, which also
  // drops EXIF metadata (GPS included).
  output: {
    mimeType: "image/webp" as const,
    extension: "webp",
    maxDimension: 1600,
    thumbDimension: 400,
    quality: 80,
  },
  // Lifetime of the presigned upload form handed to the browser.
  uploadUrlTtlSeconds: 5 * 60,
  // How long a PENDING slot counts against the per-owner limit: the form's
  // lifetime plus a grace period to confirm. Past that no file can arrive
  // anymore, so a failed or abandoned upload stops blocking new ones (the
  // limit is re-checked on confirm regardless).
  pendingSlotHoldSeconds: 10 * 60,
  // A PENDING row older than this is abandoned and can be purged.
  pendingTtlSeconds: 60 * 60,
  maxFileNameLength: 120,
} as const;

export type DeclaredUpload = {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
};

export type AcceptedUpload = {
  originalName: string;
  mimeType: ImageMimeType;
  sizeBytes: number;
};

export function isAllowedImageMime(value: string): value is ImageMimeType {
  return Object.prototype.hasOwnProperty.call(EXTENSIONS_BY_MIME, value);
}

export function maxUploadMegabytes(): number {
  return IMAGE_UPLOAD_RULES.maxBytes / (1024 * 1024);
}

// Keeps only a display-safe name: no path segments, no control characters,
// bounded length. The name is never used to build a storage key.
export function sanitizeFileName(value: string): string {
  const base = (value ?? "").split(/[\\/]/).pop() ?? "";
  const cleaned = Array.from(base.normalize("NFKC"))
    .filter((char) => {
      const code = char.charCodeAt(0);
      return code > 0x1f && code !== 0x7f && !'<>:"|?*'.includes(char);
    })
    .join("")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned.slice(0, IMAGE_UPLOAD_RULES.maxFileNameLength) || "imagem";
}

function extensionOf(fileName: string): string {
  const match = /\.([a-z0-9]+)$/i.exec(fileName.trim());
  return match ? match[1].toLowerCase() : "";
}

export function assertSizeWithinLimit(sizeBytes: number): void {
  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) {
    throw AppException.from(APP_ERRORS.attachments.fileEmpty, undefined);
  }
  if (sizeBytes > IMAGE_UPLOAD_RULES.maxBytes) {
    throw AppException.from(APP_ERRORS.attachments.fileTooLarge, {
      maxMegabytes: maxUploadMegabytes(),
    });
  }
}

// First gate, before any upload slot is handed out: what the client claims
// must be coherent and allowed. The bytes themselves are verified later by
// inspectImageSignature once the file is actually in storage.
export function assertDeclaredUpload(input: DeclaredUpload): AcceptedUpload {
  const mimeType = (input.mimeType ?? "").trim().toLowerCase();
  if (!isAllowedImageMime(mimeType)) {
    throw AppException.from(APP_ERRORS.attachments.unsupportedType, undefined);
  }

  const originalName = sanitizeFileName(input.fileName);
  const extension = extensionOf(originalName);
  if (!EXTENSIONS_BY_MIME[mimeType].includes(extension)) {
    throw AppException.from(APP_ERRORS.attachments.unsupportedType, undefined);
  }

  assertSizeWithinLimit(Number(input.sizeBytes));

  return { originalName, mimeType, sizeBytes: Number(input.sizeBytes) };
}

// Identifies the real format from the file's magic bytes, ignoring whatever
// extension or Content-Type the client sent.
export function detectImageMime(buffer: Uint8Array): ImageMimeType | null {
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return "image/jpeg";
  }

  const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (
    buffer.length >= pngSignature.length &&
    pngSignature.every((byte, index) => buffer[index] === byte)
  ) {
    return "image/png";
  }

  const ascii = (start: number, end: number) =>
    String.fromCharCode(...buffer.subarray(start, end));
  if (
    buffer.length >= 12 &&
    ascii(0, 4) === "RIFF" &&
    ascii(8, 12) === "WEBP"
  ) {
    return "image/webp";
  }

  return null;
}

export function assertImageSignature(buffer: Uint8Array): ImageMimeType {
  const detected = detectImageMime(buffer);
  if (!detected) {
    throw AppException.from(APP_ERRORS.attachments.invalidImage, undefined);
  }
  return detected;
}

export function assertImageDimensions(width: number, height: number): void {
  const { minDimension, maxDimension, maxInputPixels } = IMAGE_UPLOAD_RULES;
  const valid =
    Number.isInteger(width) &&
    Number.isInteger(height) &&
    width >= minDimension &&
    height >= minDimension &&
    width <= maxDimension &&
    height <= maxDimension &&
    width * height <= maxInputPixels;
  if (!valid) {
    throw AppException.from(
      APP_ERRORS.attachments.invalidDimensions,
      undefined,
    );
  }
}
