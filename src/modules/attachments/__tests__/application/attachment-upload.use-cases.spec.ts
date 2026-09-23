import sharp from "sharp";
import { ConfirmAttachmentUploadUseCase } from "@/modules/attachments/application/use-cases/confirm-attachment-upload.use-case";
import { CleanupStaleUploadsUseCase } from "@/modules/attachments/application/use-cases/cleanup-stale-uploads.use-case";
import { ListAttachmentsUseCase } from "@/modules/attachments/application/use-cases/list-attachments.use-case";
import { RemoveAttachmentUseCase } from "@/modules/attachments/application/use-cases/remove-attachment.use-case";
import { ReorderAttachmentsUseCase } from "@/modules/attachments/application/use-cases/reorder-attachments.use-case";
import { RequestAttachmentUploadUseCase } from "@/modules/attachments/application/use-cases/request-attachment-upload.use-case";
import { AttachmentOwnerType } from "@/modules/attachments/domain/enums/attachment-owner-type.enum";
import { AttachmentStatus } from "@/modules/attachments/domain/enums/attachment-status.enum";
import { SharpImageProcessorAdapter } from "@/modules/attachments/infrastructure/image/sharp-image-processor.adapter";
import {
  InMemoryAttachmentRepository,
  InMemoryObjectStorage,
  PRODUCT,
  STORE,
  USER,
  buildMapper,
  buildPolicies,
  expectCode,
} from "./attachments.fakes";

function image(width: number, height: number, format: "png" | "jpeg" | "webp") {
  return sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 200, g: 80, b: 40 },
    },
  })
    .toFormat(format)
    .toBuffer();
}

function setup(policyOverrides?: Parameters<typeof buildPolicies>[0]) {
  const repository = new InMemoryAttachmentRepository();
  const storage = new InMemoryObjectStorage();
  const { registry, policy } = buildPolicies(policyOverrides);
  const mapper = buildMapper(storage);
  return {
    repository,
    storage,
    policy,
    request: new RequestAttachmentUploadUseCase(repository, storage, registry),
    confirm: new ConfirmAttachmentUploadUseCase(
      repository,
      storage,
      new SharpImageProcessorAdapter(),
      registry,
      mapper,
    ),
    remove: new RemoveAttachmentUseCase(repository, storage, registry),
    reorder: new ReorderAttachmentsUseCase(repository, registry, mapper),
    list: new ListAttachmentsUseCase(repository, registry, mapper),
    cleanup: new CleanupStaleUploadsUseCase(repository, storage),
  };
}

const owner = {
  idStore: STORE,
  ownerType: AttachmentOwnerType.PRODUCT,
  ownerId: PRODUCT,
};

describe("RequestAttachmentUploadUseCase", () => {
  it("checks the owner policy, creates a PENDING row and a size/type-bound upload form", async () => {
    const { request, policy, repository, storage } = setup();

    const ticket = await request.execute(USER, {
      ...owner,
      fileName: "bolo.png",
      mimeType: "image/png",
      sizeBytes: 2048,
    });

    expect(policy.assertCanManage).toHaveBeenCalledWith(USER, STORE, PRODUCT);
    expect(repository.rows.get(ticket.idAttachment)?.status).toBe(
      AttachmentStatus.PENDING,
    );
    expect(storage.forms[0]).toEqual({
      key: `tmp/${STORE}/${ticket.idAttachment}`,
      contentType: "image/png",
      maxBytes: 5 * 1024 * 1024,
      expiresInSeconds: 300,
    });
  });

  it("refuses a 5th image (READY + live PENDING count)", async () => {
    const { request, repository } = setup();
    repository.seedReady("a", 0);
    repository.seedReady("b", 1);
    repository.seedReady("c", 2);
    await request.execute(USER, {
      ...owner,
      fileName: "d.png",
      mimeType: "image/png",
      sizeBytes: 1,
    });

    await expectCode(
      request.execute(USER, {
        ...owner,
        fileName: "e.png",
        mimeType: "image/png",
        sizeBytes: 1,
      }),
      "ATTACHMENT_LIMIT_REACHED",
    );
  });

  it("stops counting a PENDING slot once its upload form can no longer be used", async () => {
    // Regression: a failed upload (e.g. rejected by storage for size) used
    // to block a slot for the whole pending TTL (1h).
    const { request, repository } = setup();
    for (let i = 0; i < 4; i += 1) {
      const t = await request.execute(USER, {
        ...owner,
        fileName: `${i}.png`,
        mimeType: "image/png",
        sizeBytes: 1,
      });
      repository.rows.get(t.idAttachment)!.createdAt = new Date(
        Date.now() - 11 * 60_000,
      );
    }
    await expect(
      request.execute(USER, {
        ...owner,
        fileName: "ok.png",
        mimeType: "image/png",
        sizeBytes: 1,
      }),
    ).resolves.toBeDefined();
  });

  it("rejects unsupported types before handing out an upload form", async () => {
    const { request, storage, repository } = setup();
    await expectCode(
      request.execute(USER, {
        ...owner,
        fileName: "x.svg",
        mimeType: "image/svg+xml",
        sizeBytes: 1,
      }),
      "ATTACHMENT_UNSUPPORTED_TYPE",
    );
    expect(storage.forms).toHaveLength(0);
    expect(repository.rows.size).toBe(0);
  });

  it("rejects malformed ids and stops when the policy denies access", async () => {
    const denied = setup({
      assertCanManage: jest.fn().mockRejectedValue(new Error("forbidden")),
    });
    await expect(
      denied.request.execute(USER, {
        ...owner,
        fileName: "a.png",
        mimeType: "image/png",
        sizeBytes: 1,
      }),
    ).rejects.toThrow("forbidden");

    const { request } = setup();
    await expectCode(
      request.execute(USER, {
        ...owner,
        ownerId: "1 OR 1=1",
        fileName: "a.png",
        mimeType: "image/png",
        sizeBytes: 1,
      }),
      "VALIDATION_INVALID_FORMAT",
    );
  });
});

describe("ConfirmAttachmentUploadUseCase", () => {
  async function requestAndUpload(
    ctx: ReturnType<typeof setup>,
    body: Buffer,
    fileName = "a.png",
    declaredSize = Math.min(body.length, 1024),
  ) {
    const ticket = await ctx.request.execute(USER, {
      ...owner,
      fileName,
      mimeType: "image/png",
      sizeBytes: declaredSize,
    });
    ctx.storage.simulateUpload(`tmp/${STORE}/${ticket.idAttachment}`, body);
    return ticket.idAttachment;
  }

  it("re-encodes to webp, generates a thumbnail, removes the temp object and marks READY", async () => {
    const ctx = setup();
    const id = await requestAndUpload(ctx, await image(3000, 2000, "png"));

    const view = await ctx.confirm.execute(USER, {
      idStore: STORE,
      idAttachment: id,
    });

    const row = ctx.repository.rows.get(id)!;
    expect(row.status).toBe(AttachmentStatus.READY);
    expect(row.mimeType).toBe("image/webp");
    expect([row.width, row.height]).toEqual([1600, 1067]);
    expect(row.storageKey).toBe(
      `stores/${STORE}/product/${PRODUCT}/${id}.webp`,
    );
    expect(ctx.storage.objects.has(`tmp/${STORE}/${id}`)).toBe(false);

    const thumb = ctx.storage.objects.get(row.thumbnailKey!)!;
    const meta = await sharp(thumb.body).metadata();
    expect(meta.format).toBe("webp");
    expect(Math.max(meta.width!, meta.height!)).toBe(400);
    expect(view.url).toContain(row.storageKey);
  });

  it("is idempotent for an already confirmed attachment", async () => {
    const ctx = setup();
    const id = await requestAndUpload(
      ctx,
      await image(400, 400, "jpeg"),
      "a.png",
    );
    const first = await ctx.confirm.execute(USER, {
      idStore: STORE,
      idAttachment: id,
    });
    const second = await ctx.confirm.execute(USER, {
      idStore: STORE,
      idAttachment: id,
    });
    expect(second.idAttachment).toBe(first.idAttachment);
  });

  it("strips EXIF metadata (e.g. GPS) from stored images", async () => {
    const ctx = setup();
    const withExif = await sharp(await image(500, 500, "jpeg"))
      .withExif({ IFD0: { Copyright: "secret-device" } })
      .jpeg()
      .toBuffer();
    expect((await sharp(withExif).metadata()).exif).toBeDefined();

    const id = await requestAndUpload(ctx, withExif);
    await ctx.confirm.execute(USER, { idStore: STORE, idAttachment: id });

    const stored = ctx.storage.objects.get(
      ctx.repository.rows.get(id)!.storageKey,
    )!;
    expect((await sharp(stored.body).metadata()).exif).toBeUndefined();
  });

  it.each([
    [
      "a script disguised as png",
      Buffer.from("<script>alert(1)</script>".padEnd(200, " ")),
    ],
    [
      "an svg",
      Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script/></svg>'),
    ],
    [
      "a truncated png",
      Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 0x49, 0x48,
      ]),
    ],
  ])("rejects %s and discards the upload", async (_label, body) => {
    const ctx = setup();
    const id = await requestAndUpload(ctx, body);

    await expectCode(
      ctx.confirm.execute(USER, { idStore: STORE, idAttachment: id }),
      "ATTACHMENT_INVALID_IMAGE",
    );
    expect(ctx.repository.rows.has(id)).toBe(false);
    expect(ctx.storage.objects.size).toBe(0);
  });

  it("rejects images that are too small", async () => {
    const ctx = setup();
    const id = await requestAndUpload(ctx, await image(50, 50, "png"));
    await expectCode(
      ctx.confirm.execute(USER, { idStore: STORE, idAttachment: id }),
      "ATTACHMENT_INVALID_DIMENSIONS",
    );
  });

  it("rejects a stored object above 5 MB even if the declared size was small", async () => {
    const ctx = setup();
    const id = await requestAndUpload(
      ctx,
      Buffer.alloc(5 * 1024 * 1024 + 1, 1),
    );
    await expectCode(
      ctx.confirm.execute(USER, { idStore: STORE, idAttachment: id }),
      "ATTACHMENT_FILE_TOO_LARGE",
    );
    expect(ctx.repository.rows.has(id)).toBe(false);
  });

  it("keeps the slot when the file hasn't been uploaded yet, so the client can retry", async () => {
    const ctx = setup();
    const ticket = await ctx.request.execute(USER, {
      ...owner,
      fileName: "a.png",
      mimeType: "image/png",
      sizeBytes: 10,
    });
    await expectCode(
      ctx.confirm.execute(USER, {
        idStore: STORE,
        idAttachment: ticket.idAttachment,
      }),
      "ATTACHMENT_UPLOAD_NOT_FOUND",
    );
    expect(ctx.repository.rows.has(ticket.idAttachment)).toBe(true);
  });

  it("expires slots older than the pending TTL", async () => {
    const ctx = setup();
    const id = await requestAndUpload(ctx, await image(400, 400, "png"));
    ctx.repository.rows.get(id)!.createdAt = new Date(
      Date.now() - 2 * 3600_000,
    );
    await expectCode(
      ctx.confirm.execute(USER, { idStore: STORE, idAttachment: id }),
      "ATTACHMENT_UPLOAD_EXPIRED",
    );
    expect(ctx.repository.rows.has(id)).toBe(false);
  });

  it("appends new images after the existing ones", async () => {
    const ctx = setup();
    ctx.repository.seedReady("a", 0);
    ctx.repository.seedReady("b", 1);
    const id = await requestAndUpload(ctx, await image(400, 400, "webp"));
    const view = await ctx.confirm.execute(USER, {
      idStore: STORE,
      idAttachment: id,
    });
    expect(view.position).toBe(2);
  });
});

describe("remove / reorder / cover / list / cleanup", () => {
  it("removes the row and both objects, then closes the position gap", async () => {
    const ctx = setup();
    const id = "44444444-4444-4444-8444-444444444444";
    const a = ctx.repository.seedReady(id, 0);
    ctx.repository.seedReady("b", 1);
    ctx.repository.seedReady("c", 2);
    ctx.storage.simulateUpload(a.storageKey, Buffer.from("x"));
    ctx.storage.simulateUpload(a.thumbnailKey!, Buffer.from("x"));

    await ctx.remove.execute(USER, { idStore: STORE, idAttachment: id });

    expect(ctx.repository.rows.has(id)).toBe(false);
    expect(ctx.storage.objects.size).toBe(0);
    const remaining = await ctx.repository.listReady(owner);
    expect(remaining.map((r) => [r.idAttachment, r.position])).toEqual([
      ["b", 0],
      ["c", 1],
    ]);
  });

  it("reorders only with the complete set and sets a cover by moving it first", async () => {
    const ctx = setup();
    ctx.repository.seedReady("a", 0);
    ctx.repository.seedReady("b", 1);
    const c = "55555555-5555-4555-8555-555555555555";
    ctx.repository.seedReady(c, 2);

    const reordered = await ctx.reorder.execute(USER, {
      ...owner,
      orderedIds: ["b", c, "a"],
    });
    expect(reordered.map((v) => v.idAttachment)).toEqual(["b", c, "a"]);

    await expectCode(
      ctx.reorder.execute(USER, { ...owner, orderedIds: ["a", "b"] }),
      "ATTACHMENT_INVALID_ORDER",
    );

    const covered = await ctx.reorder.setCover(USER, {
      idStore: STORE,
      idAttachment: c,
    });
    expect(covered.map((v) => v.idAttachment)).toEqual([c, "b", "a"]);
  });

  it("returns only covers for many owners in one call", async () => {
    const ctx = setup();
    const other = "66666666-6666-4666-8666-666666666666";
    ctx.repository.seedReady("a", 0);
    ctx.repository.seedReady("b", 1);
    ctx.repository.seedReady("z", 0, other);

    const covers = await ctx.list.forOwners(
      STORE,
      AttachmentOwnerType.PRODUCT,
      [PRODUCT, other],
      {
        coverOnly: true,
      },
    );
    expect(covers.get(PRODUCT)?.map((v) => v.idAttachment)).toEqual(["a"]);
    expect(covers.get(other)?.map((v) => v.idAttachment)).toEqual(["z"]);
  });

  it("purges stale PENDING uploads and their temp objects", async () => {
    const ctx = setup();
    const ticket = await ctx.request.execute(USER, {
      ...owner,
      fileName: "a.png",
      mimeType: "image/png",
      sizeBytes: 10,
    });
    const key = `tmp/${STORE}/${ticket.idAttachment}`;
    ctx.storage.simulateUpload(key, Buffer.from("x"));
    ctx.repository.rows.get(ticket.idAttachment)!.createdAt = new Date(
      Date.now() - 2 * 3600_000,
    );
    ctx.repository.seedReady("keep", 0);

    await expect(ctx.cleanup.execute()).resolves.toEqual({ removed: 1 });
    expect(ctx.storage.objects.has(key)).toBe(false);
    expect(ctx.repository.rows.has("keep")).toBe(true);
  });
});
