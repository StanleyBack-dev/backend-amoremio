import type {
  AttachmentOwnerRef,
  AttachmentRecord,
  AttachmentRepositoryPort,
  CreatePendingAttachmentPayload,
  MarkAttachmentReadyPayload,
} from "@/modules/attachments/application/ports/attachment-repository.port";
import type { AttachmentOwnerPolicy } from "@/modules/attachments/application/ports/attachment-owner-policy.port";
import type {
  CreateUploadFormParams,
  ObjectStoragePort,
  PutObjectParams,
} from "@/modules/attachments/application/ports/object-storage.port";
import { AttachmentOwnerPolicyRegistry } from "@/modules/attachments/application/use-cases/attachment-owner-policy.registry";
import { AttachmentViewMapper } from "@/modules/attachments/application/use-cases/attachment-view.mapper";
import { AttachmentOwnerType } from "@/modules/attachments/domain/enums/attachment-owner-type.enum";
import { AttachmentStatus } from "@/modules/attachments/domain/enums/attachment-status.enum";

export const STORE = "11111111-1111-4111-8111-111111111111";
export const PRODUCT = "22222222-2222-4222-8222-222222222222";
export const USER = "33333333-3333-4333-8333-333333333333";

export class InMemoryAttachmentRepository implements AttachmentRepositoryPort {
  rows = new Map<string, AttachmentRecord>();

  async createPending(p: CreatePendingAttachmentPayload) {
    const now = new Date();
    const row: AttachmentRecord = {
      ...p,
      status: AttachmentStatus.PENDING,
      thumbnailKey: null,
      width: null,
      height: null,
      checksumSha256: null,
      position: 0,
      createdAt: now,
      updatedAt: now,
    };
    this.rows.set(row.idAttachment, row);
    return row;
  }

  async markReady(p: MarkAttachmentReadyPayload) {
    const row = {
      ...this.rows.get(p.idAttachment)!,
      ...p,
      status: AttachmentStatus.READY,
    };
    this.rows.set(row.idAttachment, row);
    return row;
  }

  async findById(idStore: string, id: string) {
    const row = this.rows.get(id);
    return row && row.idStore === idStore ? row : null;
  }

  private ofOwner(owner: AttachmentOwnerRef) {
    return [...this.rows.values()].filter(
      (r) =>
        r.idStore === owner.idStore &&
        r.ownerType === owner.ownerType &&
        r.ownerId === owner.ownerId,
    );
  }

  async listReady(owner: AttachmentOwnerRef) {
    return this.ofOwner(owner)
      .filter((r) => r.status === AttachmentStatus.READY)
      .sort((a, b) => a.position - b.position);
  }

  async listReadyByOwners(
    idStore: string,
    ownerType: AttachmentOwnerType,
    ids: string[],
  ) {
    return [...this.rows.values()]
      .filter(
        (r) =>
          r.idStore === idStore &&
          r.ownerType === ownerType &&
          ids.includes(r.ownerId) &&
          r.status === AttachmentStatus.READY,
      )
      .sort(
        (a, b) => a.ownerId.localeCompare(b.ownerId) || a.position - b.position,
      );
  }

  async countActive(owner: AttachmentOwnerRef, pendingSince: Date) {
    return this.ofOwner(owner).filter(
      (r) => r.status === AttachmentStatus.READY || r.createdAt >= pendingSince,
    ).length;
  }

  async updatePositions(_idStore: string, orderedIds: string[]) {
    orderedIds.forEach((id, index) => {
      const row = this.rows.get(id);
      if (row) this.rows.set(id, { ...row, position: index });
    });
  }

  async delete(_idStore: string, id: string) {
    this.rows.delete(id);
  }

  async listStalePending(olderThan: Date, limit: number) {
    return [...this.rows.values()]
      .filter(
        (r) => r.status === AttachmentStatus.PENDING && r.createdAt < olderThan,
      )
      .slice(0, limit);
  }

  async deleteMany(ids: string[]) {
    ids.forEach((id) => this.rows.delete(id));
  }

  // Test helper: a READY image already attached to the product.
  seedReady(id: string, position: number, ownerId = PRODUCT): AttachmentRecord {
    const now = new Date();
    const row: AttachmentRecord = {
      idAttachment: id,
      idStore: STORE,
      ownerType: AttachmentOwnerType.PRODUCT,
      ownerId,
      status: AttachmentStatus.READY,
      storageKey: `stores/${STORE}/product/${ownerId}/${id}.webp`,
      thumbnailKey: `stores/${STORE}/product/${ownerId}/${id}_thumb.webp`,
      mimeType: "image/webp",
      sizeBytes: 10,
      width: 100,
      height: 100,
      checksumSha256: "x".repeat(64),
      position,
      originalName: `${id}.png`,
      createdByUserId: USER,
      createdAt: now,
      updatedAt: now,
    };
    this.rows.set(id, row);
    return row;
  }
}

export class InMemoryObjectStorage implements ObjectStoragePort {
  objects = new Map<string, { body: Buffer; contentType: string }>();
  forms: CreateUploadFormParams[] = [];

  async createUploadForm(params: CreateUploadFormParams) {
    this.forms.push(params);
    return {
      url: "https://storage.test/bucket",
      fields: { key: params.key, "Content-Type": params.contentType },
      expiresAt: new Date(Date.now() + params.expiresInSeconds * 1000),
    };
  }

  async head(key: string) {
    const object = this.objects.get(key);
    return object
      ? { sizeBytes: object.body.length, contentType: object.contentType }
      : null;
  }

  async getBuffer(key: string, maxBytes: number) {
    return this.objects.get(key)!.body.subarray(0, maxBytes + 1);
  }

  async put(params: PutObjectParams) {
    this.objects.set(params.key, {
      body: params.body,
      contentType: params.contentType,
    });
  }

  async deleteMany(keys: string[]) {
    keys.forEach((key) => this.objects.delete(key));
  }

  async signedReadUrl(key: string) {
    return `https://signed.test/${key}`;
  }

  // Test helper: simulates the browser finishing the presigned upload.
  simulateUpload(key: string, body: Buffer, contentType = "image/png") {
    this.objects.set(key, { body, contentType });
  }
}

export function buildPolicies(overrides?: Partial<AttachmentOwnerPolicy>) {
  const policy = {
    ownerType: AttachmentOwnerType.PRODUCT,
    maxAttachments: 4,
    assertCanManage: jest.fn().mockResolvedValue(undefined),
    assertCanView: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
  const registry = new AttachmentOwnerPolicyRegistry();
  registry.register(policy);
  return { registry, policy };
}

export function buildMapper(storage: ObjectStoragePort) {
  return new AttachmentViewMapper(storage);
}

export async function expectCode(promise: Promise<unknown>, code: string) {
  await expect(promise).rejects.toMatchObject({ response: { code } });
}
