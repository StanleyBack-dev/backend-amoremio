import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { RESPONSE_MESSAGES } from "@/common/responses/catalogs/response-messages.catalog";
import { SuccessResponseDto } from "@/common/responses/dtos/success-response.dto";
import {
  buildDataResponse,
  buildSuccessResponse,
} from "@/common/responses/helpers/response.helper";
import type { AuthenticatedUser } from "@/modules/auth/domain/interfaces/auth-token-payload.interface";
import { ConfirmAttachmentUploadUseCase } from "@/modules/attachments/application/use-cases/confirm-attachment-upload.use-case";
import { ListAttachmentsUseCase } from "@/modules/attachments/application/use-cases/list-attachments.use-case";
import { RemoveAttachmentUseCase } from "@/modules/attachments/application/use-cases/remove-attachment.use-case";
import { ReorderAttachmentsUseCase } from "@/modules/attachments/application/use-cases/reorder-attachments.use-case";
import { RequestAttachmentUploadUseCase } from "@/modules/attachments/application/use-cases/request-attachment-upload.use-case";
import {
  AttachmentOwnerInputDto,
  AttachmentRefInputDto,
  ReorderAttachmentsInputDto,
  RequestAttachmentUploadInputDto,
} from "@/modules/attachments/presentation/graphql/dtos/attachment-input.dtos";
import {
  AttachmentMutationResponseDto,
  AttachmentResponseDto,
  AttachmentUploadTicketDto,
  AttachmentUploadTicketResponseDto,
  AttachmentsMutationResponseDto,
} from "@/modules/attachments/presentation/graphql/dtos/attachment-response.dtos";
import "@/modules/attachments/presentation/graphql/enums/attachments-graphql.enums";

@Resolver()
export class AttachmentsResolver {
  constructor(
    private readonly requestUploadUseCase: RequestAttachmentUploadUseCase,
    private readonly confirmUploadUseCase: ConfirmAttachmentUploadUseCase,
    private readonly removeUseCase: RemoveAttachmentUseCase,
    private readonly reorderUseCase: ReorderAttachmentsUseCase,
    private readonly listUseCase: ListAttachmentsUseCase,
  ) {}

  @Query(() => [AttachmentResponseDto], { name: "getAttachments" })
  async getAttachments(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: AttachmentOwnerInputDto,
  ) {
    const views = await this.listUseCase.execute(user.idUsers, input);
    return views.map((view) => AttachmentResponseDto.fromView(view));
  }

  @Mutation(() => AttachmentUploadTicketResponseDto, {
    name: "requestAttachmentUpload",
  })
  async requestAttachmentUpload(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: RequestAttachmentUploadInputDto,
  ) {
    const ticket = await this.requestUploadUseCase.execute(user.idUsers, {
      idStore: input.idStore,
      ownerType: input.ownerType,
      ownerId: input.ownerId,
      fileName: input.fileName,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
    });
    return buildDataResponse(
      AttachmentUploadTicketDto.fromTicket(ticket),
      RESPONSE_MESSAGES.attachments.uploadRequested,
    );
  }

  @Mutation(() => AttachmentMutationResponseDto, {
    name: "confirmAttachmentUpload",
  })
  async confirmAttachmentUpload(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: AttachmentRefInputDto,
  ) {
    const view = await this.confirmUploadUseCase.execute(user.idUsers, input);
    return buildDataResponse(
      AttachmentResponseDto.fromView(view),
      RESPONSE_MESSAGES.attachments.confirmed,
    );
  }

  @Mutation(() => SuccessResponseDto, { name: "removeAttachment" })
  async removeAttachment(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: AttachmentRefInputDto,
  ) {
    await this.removeUseCase.execute(user.idUsers, input);
    return buildSuccessResponse(RESPONSE_MESSAGES.attachments.removed);
  }

  @Mutation(() => AttachmentsMutationResponseDto, {
    name: "reorderAttachments",
  })
  async reorderAttachments(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: ReorderAttachmentsInputDto,
  ) {
    const views = await this.reorderUseCase.execute(user.idUsers, input);
    return buildDataResponse(
      views.map((view) => AttachmentResponseDto.fromView(view)),
      RESPONSE_MESSAGES.attachments.reordered,
    );
  }

  @Mutation(() => AttachmentsMutationResponseDto, {
    name: "setAttachmentAsCover",
  })
  async setAttachmentAsCover(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: AttachmentRefInputDto,
  ) {
    const views = await this.reorderUseCase.setCover(user.idUsers, input);
    return buildDataResponse(
      views.map((view) => AttachmentResponseDto.fromView(view)),
      RESPONSE_MESSAGES.attachments.reordered,
    );
  }
}
