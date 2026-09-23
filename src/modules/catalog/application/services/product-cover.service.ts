import { Injectable } from "@nestjs/common";
import { ListAttachmentsUseCase } from "@/modules/attachments/application/use-cases/list-attachments.use-case";
import { AttachmentOwnerType } from "@/modules/attachments/domain/enums/attachment-owner-type.enum";

// Cover thumbnail lookup for screens outside the catalog that show product
// rows (stock, sale items...). One batched query per call. Performs no
// authorization: callers pass ids they already loaded for this user.
@Injectable()
export class ProductCoverService {
  constructor(
    private readonly listAttachmentsUseCase: ListAttachmentsUseCase,
  ) {}

  async thumbnailsFor(
    idStore: string,
    idProducts: string[],
  ): Promise<Map<string, string>> {
    const unique = [...new Set(idProducts)];
    const covers = await this.listAttachmentsUseCase.forOwners(
      idStore,
      AttachmentOwnerType.PRODUCT,
      unique,
      { coverOnly: true },
    );
    const result = new Map<string, string>();
    for (const [idProduct, [cover]] of covers) {
      if (cover) result.set(idProduct, cover.thumbnailUrl);
    }
    return result;
  }
}
