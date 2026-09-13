import { Inject, Injectable } from "@nestjs/common";
import { StoreAuthorizationService } from "@/modules/stores/application/use-cases/store-authorization.use-case";
import { StorePermission } from "@/modules/stores/domain/enums/store-permission.enum";
import {
  SHOPPING_LIST_REPOSITORY,
  type ShoppingListRepositoryPort,
  type ShoppingListView,
} from "@/modules/shopping-list/application/ports/shopping-list-repository.port";
import { CreateShoppingListCommand } from "@/modules/shopping-list/application/dto/shopping-list.commands";

@Injectable()
export class CreateShoppingListUseCase {
  constructor(
    @Inject(SHOPPING_LIST_REPOSITORY)
    private readonly shoppingListRepository: ShoppingListRepositoryPort,
    private readonly storeAuthorizationService: StoreAuthorizationService,
  ) {}

  async execute(
    userId: string,
    command: CreateShoppingListCommand,
  ): Promise<ShoppingListView> {
    await this.storeAuthorizationService.assertStorePermission(
      userId,
      command.idStore,
      StorePermission.REGISTER_PURCHASE,
    );

    return this.shoppingListRepository.create({
      idStore: command.idStore,
      name: (command.name ?? "").trim() || null,
      notes: (command.notes ?? "").trim() || null,
      createdByUserId: userId,
    });
  }
}
