import { Inject, Injectable } from "@nestjs/common";
import { currentDateOnly } from "@/common/utils/date.util";
import { StoreAuthorizationService } from "@/modules/stores/application/use-cases/store-authorization.use-case";
import { StorePermission } from "@/modules/stores/domain/enums/store-permission.enum";
import {
  PURCHASE_REPOSITORY,
  type PurchaseRepositoryPort,
  type PurchaseView,
} from "@/modules/purchasing/application/ports/purchase-repository.port";
import { CreatePurchaseDraftCommand } from "@/modules/purchasing/application/dto/purchase.commands";

@Injectable()
export class CreatePurchaseDraftUseCase {
  constructor(
    @Inject(PURCHASE_REPOSITORY)
    private readonly purchaseRepository: PurchaseRepositoryPort,
    private readonly storeAuthorizationService: StoreAuthorizationService,
  ) {}

  async execute(
    userId: string,
    command: CreatePurchaseDraftCommand,
  ): Promise<PurchaseView> {
    await this.storeAuthorizationService.assertStorePermission(
      userId,
      command.idStore,
      StorePermission.REGISTER_PURCHASE,
    );

    return this.purchaseRepository.create({
      idStore: command.idStore,
      supplierName: (command.supplierName ?? "").trim() || null,
      purchaseDate: command.purchaseDate ?? currentDateOnly(),
      notes: (command.notes ?? "").trim() || null,
      createdByUserId: userId,
    });
  }
}
