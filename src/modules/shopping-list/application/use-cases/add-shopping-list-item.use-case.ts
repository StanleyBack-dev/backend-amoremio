import { Inject, Injectable } from "@nestjs/common";
import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import {
  PRODUCT_REPOSITORY,
  type ProductRepositoryPort,
} from "@/modules/catalog/application/ports/product-repository.port";
import { PURCHASABLE_KINDS } from "@/modules/catalog/domain/enums/product-kind.enum";
import { StoreAuthorizationService } from "@/modules/stores/application/use-cases/store-authorization.use-case";
import { StorePermission } from "@/modules/stores/domain/enums/store-permission.enum";
import {
  SHOPPING_LIST_REPOSITORY,
  type ShoppingListRepositoryPort,
  type ShoppingListView,
} from "@/modules/shopping-list/application/ports/shopping-list-repository.port";
import { AddShoppingListItemCommand } from "@/modules/shopping-list/application/dto/shopping-list.commands";
import {
  assertOpen,
  loadShoppingListOrFail,
} from "@/modules/shopping-list/application/use-cases/shopping-list-access.helper";

@Injectable()
export class AddShoppingListItemUseCase {
  constructor(
    @Inject(SHOPPING_LIST_REPOSITORY)
    private readonly shoppingListRepository: ShoppingListRepositoryPort,
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepositoryPort,
    private readonly storeAuthorizationService: StoreAuthorizationService,
  ) {}

  async execute(
    userId: string,
    command: AddShoppingListItemCommand,
  ): Promise<ShoppingListView> {
    await this.storeAuthorizationService.assertStorePermission(
      userId,
      command.idStore,
      StorePermission.REGISTER_PURCHASE,
    );

    const list = await loadShoppingListOrFail(
      this.shoppingListRepository,
      command.idStore,
      command.idShoppingList,
    );
    assertOpen(list);

    const product = await this.productRepository.findById(
      command.idStore,
      command.idProduct,
    );
    if (!product) {
      throw AppException.from(APP_ERRORS.catalog.productNotFound, undefined);
    }

    if (!PURCHASABLE_KINDS.includes(product.kind)) {
      throw AppException.from(
        APP_ERRORS.shoppingList.productNotPurchasable,
        undefined,
      );
    }

    // One line per product — the quantity is edited on the existing line.
    if (list.items.some((item) => item.idProduct === product.idProduct)) {
      throw AppException.from(APP_ERRORS.shoppingList.duplicatedItem, {
        product: product.name,
      });
    }

    return this.shoppingListRepository.addItem({
      idShoppingList: command.idShoppingList,
      idProduct: product.idProduct,
      productName: product.name,
      unit: product.unit,
      desiredQuantity: command.desiredQuantity,
      note: (command.note ?? "").trim() || null,
    });
  }
}
