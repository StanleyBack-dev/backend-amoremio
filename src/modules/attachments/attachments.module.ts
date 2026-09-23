import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ATTACHMENT_REPOSITORY } from "@/modules/attachments/application/ports/attachment-repository.port";
import { IMAGE_PROCESSOR } from "@/modules/attachments/application/ports/image-processor.port";
import { OBJECT_STORAGE } from "@/modules/attachments/application/ports/object-storage.port";
import { AttachmentOwnerPolicyRegistry } from "@/modules/attachments/application/use-cases/attachment-owner-policy.registry";
import { AttachmentViewMapper } from "@/modules/attachments/application/use-cases/attachment-view.mapper";
import { CleanupStaleUploadsUseCase } from "@/modules/attachments/application/use-cases/cleanup-stale-uploads.use-case";
import { ConfirmAttachmentUploadUseCase } from "@/modules/attachments/application/use-cases/confirm-attachment-upload.use-case";
import { ListAttachmentsUseCase } from "@/modules/attachments/application/use-cases/list-attachments.use-case";
import { RemoveAttachmentUseCase } from "@/modules/attachments/application/use-cases/remove-attachment.use-case";
import { ReorderAttachmentsUseCase } from "@/modules/attachments/application/use-cases/reorder-attachments.use-case";
import { RequestAttachmentUploadUseCase } from "@/modules/attachments/application/use-cases/request-attachment-upload.use-case";
import storageConfig from "@/modules/attachments/infrastructure/config/storage.config";
import { SharpImageProcessorAdapter } from "@/modules/attachments/infrastructure/image/sharp-image-processor.adapter";
import { AttachmentEntity } from "@/modules/attachments/infrastructure/persistence/typeorm/entities/attachment.entity";
import { AttachmentTypeormRepository } from "@/modules/attachments/infrastructure/persistence/typeorm/repositories/attachment-typeorm.repository";
import { NeonS3ObjectStorageAdapter } from "@/modules/attachments/infrastructure/storage/neon-s3-object-storage.adapter";
import { AttachmentsResolver } from "@/modules/attachments/presentation/graphql/resolvers/attachments.resolver";
import { AttachmentsMaintenanceController } from "@/modules/attachments/presentation/rest/attachments-maintenance.controller";
import "@/modules/attachments/presentation/graphql/enums/attachments-graphql.enums";

// Generic file attachments (images for now) stored in object storage, with
// metadata in Postgres. Owner modules plug in by registering an
// AttachmentOwnerPolicy in AttachmentOwnerPolicyRegistry; this module never
// imports them.
@Module({
  imports: [
    TypeOrmModule.forFeature([AttachmentEntity]),
    ConfigModule.forFeature(storageConfig),
  ],
  controllers: [AttachmentsMaintenanceController],
  providers: [
    AttachmentTypeormRepository,
    {
      provide: ATTACHMENT_REPOSITORY,
      useExisting: AttachmentTypeormRepository,
    },
    NeonS3ObjectStorageAdapter,
    { provide: OBJECT_STORAGE, useExisting: NeonS3ObjectStorageAdapter },
    SharpImageProcessorAdapter,
    { provide: IMAGE_PROCESSOR, useExisting: SharpImageProcessorAdapter },
    AttachmentOwnerPolicyRegistry,
    AttachmentViewMapper,
    RequestAttachmentUploadUseCase,
    ConfirmAttachmentUploadUseCase,
    RemoveAttachmentUseCase,
    ReorderAttachmentsUseCase,
    ListAttachmentsUseCase,
    CleanupStaleUploadsUseCase,
    AttachmentsResolver,
  ],
  exports: [AttachmentOwnerPolicyRegistry, ListAttachmentsUseCase],
})
export class AttachmentsModule {}
