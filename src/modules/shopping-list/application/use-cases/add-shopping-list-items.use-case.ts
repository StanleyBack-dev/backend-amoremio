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
  type AddShoppingListItemsPayload,
  type ShoppingListRepositoryPort,
  type ShoppingListView,
} from "@/modules/shopping-list/application/ports/shopping-list-repository.port";
import { AddShoppingListItemsCommand } from "@/modules/shopping-list/application/dto/shopping-list.commands";
import {
  assertOpen,
  loadShoppingListOrFail,
} from "@/modules/shopping-list/application/use-cases/shopping-list-access.helper";

@Injectable()
export class AddShoppingListItemsUseCase {
  constructor(
    @Inject(SHOPPING_LIST_REPOSITORY)
    private readonly shoppingListRepository: ShoppingListRepositoryPort,
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepositoryPort,
    private readonly storeAuthorizationService: StoreAuthorizationService,
  ) {}

  async execute(
    userId: string,
    command: AddShoppingListItemsCommand,
  ): Promise<ShoppingListView> {
    if (!command.items || command.items.length === 0) {
      throw AppException.from(APP_ERRORS.shoppingList.noItemsToAdd, undefined);
    }

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

    // One query for every referenced product instead of one per entry — a
    // staged batch can hold a dozen items and the round-trips add up.
    const requestedIds = [
      ...new Set(command.items.map((entry) => entry.idProduct)),
    ];
    const products = await this.productRepository.findManyByIds(
      command.idStore,
      requestedIds,
    );
    const productById = new Map(products.map((p) => [p.idProduct, p]));

    // Validate every entry before touching the database, so the batch is
    // all-or-nothing from the caller's point of view.
    const items: AddShoppingListItemsPayload["items"] = [];
    const seen = new Set(list.items.map((item) => item.idProduct));
    for (const entry of command.items) {
      const product = productById.get(entry.idProduct);
      if (!product) {
        throw AppException.from(APP_ERRORS.catalog.productNotFound, undefined);
      }
      if (!PURCHASABLE_KINDS.includes(product.kind)) {
        throw AppException.from(
          APP_ERRORS.shoppingList.productNotPurchasable,
          undefined,
        );
      }
      if (seen.has(product.idProduct)) {
        throw AppException.from(APP_ERRORS.shoppingList.duplicatedItem, {
          product: product.name,
        });
      }
      seen.add(product.idProduct);
      items.push({
        idProduct: product.idProduct,
        productName: product.name,
        unit: product.unit,
        desiredQuantity: entry.desiredQuantity,
        note: (entry.note ?? "").trim() || null,
      });
    }

    return this.shoppingListRepository.addItems({
      idShoppingList: command.idShoppingList,
      items,
    });
  }
}
