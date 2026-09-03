import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { RESPONSE_MESSAGES } from "@/common/responses/catalogs/response-messages.catalog";
import {
  buildPaginatedListResponse,
  buildSuccessResponse,
} from "@/common/responses/helpers/response.helper";
import { SuccessResponseDto } from "@/common/responses/dtos/success-response.dto";
import type { AuthenticatedUser } from "@/modules/auth/domain/interfaces/auth-token-payload.interface";
import { AdjustStockUseCase } from "@/modules/inventory/application/use-cases/adjust-stock.use-case";
import { ListStoreStockUseCase } from "@/modules/inventory/application/use-cases/list-store-stock.use-case";
import { ListStockMovementsUseCase } from "@/modules/inventory/application/use-cases/list-stock-movements.use-case";
import {
  StockItemResponseDto,
  StockMovementResponseDto,
} from "@/modules/inventory/presentation/graphql/dtos/inventory-response.dtos";
import {
  ListStockMovementsResponseDto,
  ListStoreStockResponseDto,
} from "@/modules/inventory/presentation/graphql/dtos/inventory-list-response.dtos";
import {
  AdjustStockInputDto,
  ListStockMovementsInputDto,
  ListStoreStockInputDto,
} from "@/modules/inventory/presentation/graphql/dtos/inventory-input.dtos";
import "@/modules/inventory/presentation/graphql/enums/inventory-graphql.enums";
import "@/modules/catalog/presentation/graphql/enums/catalog-graphql.enums";

@Resolver()
export class InventoryResolver {
  constructor(
    private readonly adjustStockUseCase: AdjustStockUseCase,
    private readonly listStoreStockUseCase: ListStoreStockUseCase,
    private readonly listStockMovementsUseCase: ListStockMovementsUseCase,
  ) {}

  @Query(() => ListStoreStockResponseDto, { name: "getStoreStock" })
  async getStoreStock(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: ListStoreStockInputDto,
  ) {
    const result = await this.listStoreStockUseCase.execute(
      user.idUsers,
      input.idStore,
      {
        name: input.name,
        brand: input.brand,
        withoutBrand: input.withoutBrand,
        kind: input.kind,
        unit: input.unit,
        status: input.status,
        page: input.page,
        limit: input.limit,
      },
    );
    return {
      success: true,
      message: RESPONSE_MESSAGES.inventory.listed.message,
      code: RESPONSE_MESSAGES.inventory.listed.code,
      items: result.items.map((item) => StockItemResponseDto.fromView(item)),
      total: result.total,
      currentPage: result.currentPage,
      limit: result.limit,
      totalPages: result.totalPages,
      hasNextPage: result.hasNextPage,
      stockValueTotal: result.stockValueTotal,
    };
  }

  @Query(() => ListStockMovementsResponseDto, { name: "getStockMovements" })
  async getStockMovements(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: ListStockMovementsInputDto,
  ) {
    const result = await this.listStockMovementsUseCase.execute(
      user.idUsers,
      input.idStore,
      {
        idProduct: input.idProduct,
        type: input.type,
        page: input.page,
        limit: input.limit,
      },
    );
    return buildPaginatedListResponse(
      {
        ...result,
        items: result.items.map((movement) =>
          StockMovementResponseDto.fromView(movement),
        ),
      },
      RESPONSE_MESSAGES.inventory.movementsListed,
    );
  }

  @Mutation(() => SuccessResponseDto, { name: "adjustStock" })
  async adjustStock(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: AdjustStockInputDto,
  ) {
    await this.adjustStockUseCase.execute(user.idUsers, {
      idStore: input.idStore,
      idProduct: input.idProduct,
      type: input.type as never,
      quantity: input.quantity,
      unitCost: input.unitCost,
      note: input.note,
    });
    return buildSuccessResponse(RESPONSE_MESSAGES.inventory.adjusted);
  }
}
