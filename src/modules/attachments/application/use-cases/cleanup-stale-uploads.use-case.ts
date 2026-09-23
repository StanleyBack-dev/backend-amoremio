import { Inject, Injectable, Logger } from "@nestjs/common";
import {
  ATTACHMENT_REPOSITORY,
  type AttachmentRepositoryPort,
} from "@/modules/attachments/application/ports/attachment-repository.port";
import {
  OBJECT_STORAGE,
  type ObjectStoragePort,
} from "@/modules/attachments/application/ports/object-storage.port";
import { IMAGE_UPLOAD_RULES } from "@/modules/attachments/domain/policies/image-upload.policy";

const BATCH_SIZE = 200;
const MAX_BATCHES = 10;

// Neon stores bucket lifecycle rules but does not execute them, so abandoned
// upload slots (user closed the tab mid-upload) are purged here instead.
@Injectable()
export class CleanupStaleUploadsUseCase {
  private readonly logger = new Logger(CleanupStaleUploadsUseCase.name);

  constructor(
    @Inject(ATTACHMENT_REPOSITORY)
    private readonly attachmentRepository: AttachmentRepositoryPort,
    @Inject(OBJECT_STORAGE)
    private readonly storage: ObjectStoragePort,
  ) {}

  async execute(): Promise<{ removed: number }> {
    const olderThan = new Date(
      Date.now() - IMAGE_UPLOAD_RULES.pendingTtlSeconds * 1000,
    );
    let removed = 0;

    for (let batch = 0; batch < MAX_BATCHES; batch += 1) {
      const stale = await this.attachmentRepository.listStalePending(
        olderThan,
        BATCH_SIZE,
      );
      if (stale.length === 0) break;

      await this.storage.deleteMany(stale.map((record) => record.storageKey));
      await this.attachmentRepository.deleteMany(
        stale.map((record) => record.idAttachment),
      );
      removed += stale.length;
      if (stale.length < BATCH_SIZE) break;
    }

    if (removed > 0) {
      this.logger.log(`Removed ${removed} stale pending upload(s).`);
    }
    return { removed };
  }
}
