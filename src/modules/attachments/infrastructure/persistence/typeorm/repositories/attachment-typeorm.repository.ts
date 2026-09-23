import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, LessThan, MoreThanOrEqual, Repository } from "typeorm";
import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import type {
  AttachmentOwnerRef,
  AttachmentRecord,
  AttachmentRepositoryPort,
  CreatePendingAttachmentPayload,
  MarkAttachmentReadyPayload,
} from "@/modules/attachments/application/ports/attachment-repository.port";
import type { AttachmentOwnerType } from "@/modules/attachments/domain/enums/attachment-owner-type.enum";
import { AttachmentStatus } from "@/modules/attachments/domain/enums/attachment-status.enum";
import { AttachmentEntity } from "@/modules/attachments/infrastructure/persistence/typeorm/entities/attachment.entity";

@Injectable()
export class AttachmentTypeormRepository implements AttachmentRepositoryPort {
  constructor(
    @InjectRepository(AttachmentEntity)
    private readonly repository: Repository<AttachmentEntity>,
  ) {}

  async createPending(
    payload: CreatePendingAttachmentPayload,
  ): Promise<AttachmentRecord> {
    const saved = await this.repository.save(
      this.repository.create({
        ...payload,
        status: AttachmentStatus.PENDING,
        thumbnailKey: null,
        width: null,
        height: null,
        checksumSha256: null,
        position: 0,
      }),
    );
    return this.mapToRecord(saved);
  }

  async markReady(
    payload: MarkAttachmentReadyPayload,
  ): Promise<AttachmentRecord> {
    const attachment = await this.repository.findOne({
      where: { idAttachment: payload.idAttachment },
    });
    if (!attachment) {
      throw AppException.from(APP_ERRORS.attachments.notFound, undefined);
    }
    Object.assign(attachment, payload, { status: AttachmentStatus.READY });
    return this.mapToRecord(await this.repository.save(attachment));
  }

  async findById(
    idStore: string,
    idAttachment: string,
  ): Promise<AttachmentRecord | null> {
    const attachment = await this.repository.findOne({
      where: { idStore, idAttachment },
    });
    return attachment ? this.mapToRecord(attachment) : null;
  }

  async listReady(owner: AttachmentOwnerRef): Promise<AttachmentRecord[]> {
    const rows = await this.repository.find({
      where: { ...owner, status: AttachmentStatus.READY },
      order: { position: "ASC", createdAt: "ASC" },
    });
    return rows.map((row) => this.mapToRecord(row));
  }

  async listReadyByOwners(
    idStore: string,
    ownerType: AttachmentOwnerType,
    ownerIds: string[],
  ): Promise<AttachmentRecord[]> {
    if (ownerIds.length === 0) return [];
    const rows = await this.repository.find({
      where: {
        idStore,
        ownerType,
        ownerId: In(ownerIds),
        status: AttachmentStatus.READY,
      },
      order: { ownerId: "ASC", position: "ASC", createdAt: "ASC" },
    });
    return rows.map((row) => this.mapToRecord(row));
  }

  async countActive(
    owner: AttachmentOwnerRef,
    pendingSince: Date,
  ): Promise<number> {
    return this.repository.count({
      where: [
        { ...owner, status: AttachmentStatus.READY },
        {
          ...owner,
          status: AttachmentStatus.PENDING,
          createdAt: MoreThanOrEqual(pendingSince),
        },
      ],
    });
  }

  // One statement for the whole order: position = index in `orderedIds`.
  async updatePositions(idStore: string, orderedIds: string[]): Promise<void> {
    if (orderedIds.length === 0) return;
    await this.repository.query(
      `UPDATE "tb_attachments" AS a
          SET "position" = v.ord - 1, "updated_at" = now()
         FROM unnest($1::uuid[]) WITH ORDINALITY AS v(id, ord)
        WHERE a."idtb_attachments" = v.id
          AND a."idtb_stores" = $2`,
      [orderedIds, idStore],
    );
  }

  async delete(idStore: string, idAttachment: string): Promise<void> {
    await this.repository.delete({ idStore, idAttachment });
  }

  async listStalePending(
    olderThan: Date,
    limit: number,
  ): Promise<AttachmentRecord[]> {
    const rows = await this.repository.find({
      where: {
        status: AttachmentStatus.PENDING,
        createdAt: LessThan(olderThan),
      },
      order: { createdAt: "ASC" },
      take: limit,
    });
    return rows.map((row) => this.mapToRecord(row));
  }

  async deleteMany(idAttachments: string[]): Promise<void> {
    if (idAttachments.length === 0) return;
    await this.repository.delete({ idAttachment: In(idAttachments) });
  }

  private mapToRecord(entity: AttachmentEntity): AttachmentRecord {
    return {
      idAttachment: entity.idAttachment,
      idStore: entity.idStore,
      ownerType: entity.ownerType,
      ownerId: entity.ownerId,
      status: entity.status,
      storageKey: entity.storageKey,
      thumbnailKey: entity.thumbnailKey ?? null,
      mimeType: entity.mimeType,
      sizeBytes: entity.sizeBytes,
      width: entity.width ?? null,
      height: entity.height ?? null,
      checksumSha256: entity.checksumSha256 ?? null,
      position: entity.position,
      originalName: entity.originalName,
      createdByUserId: entity.createdByUserId,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
