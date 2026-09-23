import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { RESPONSE_MESSAGES } from "@/common/responses/catalogs/response-messages.catalog";
import {
  buildDataResponse,
  buildPaginatedListResponse,
} from "@/common/responses/helpers/response.helper";
import type { AuthenticatedUser } from "@/modules/auth/domain/interfaces/auth-token-payload.interface";
import { ProductCoverService } from "@/modules/catalog/application/services/product-cover.service";
import type { SalesOrderView } from "@/modules/sales/application/ports/sales-order-repository.port";
import { SalesOrderCrudUseCases } from "@/modules/sales/application/use-cases/sales-order-crud.use-cases";
import { ConfirmSalesOrderUseCase } from "@/modules/sales/application/use-cases/confirm-sales-order.use-case";
import { CancelSalesOrderUseCase } from "@/modules/sales/application/use-cases/cancel-sales-order.use-case";
import { SalesOrderResponseDto } from "@/modules/sales/presentation/graphql/dtos/sales-order-response.dto";
import { SalesOrderFilterOptionsDto } from "@/modules/sales/presentation/graphql/dtos/sales-order-filter-options.dto";
import {
  ListSalesOrdersResponseDto,
  SalesOrderMutationResponseDto,
} from "@/modules/sales/presentation/graphql/dtos/sales-order-list-response.dto";
import {
  AddSalesOrderItemInputDto,
  AddSalesOrderItemsInputDto,
  CreateSalesOrderInputDto,
  GetSalesOrderFilterOptionsInputDto,
  ListSalesOrdersInputDto,
  RemoveSalesOrderItemInputDto,
  SalesOrderScopeInputDto,
  UpdateSalesOrderHeaderInputDto,
  UpdateSalesOrderItemInputDto,
} from "@/modules/sales/presentation/graphql/dtos/sales-order-input.dtos";
import "@/modules/sales/presentation/graphql/enums/sales-graphql.enums";

@Resolver()
export class SalesOrdersResolver {
  constructor(
    private readonly crud: SalesOrderCrudUseCases,
    private readonly confirmSalesOrderUseCase: ConfirmSalesOrderUseCase,
    private readonly cancelSalesOrderUseCase: CancelSalesOrderUseCase,
    private readonly productCoverService: ProductCoverService,
  ) {}

  // Single-order responses show the items with product photos; the order
  // list doesn't render items, so it skips this lookup.
  private async toDetailDto(view: SalesOrderView) {
    const covers = await this.productCoverService.thumbnailsFor(
      view.idStore,
      view.items.map((item) => item.idProduct),
    );
    return SalesOrderResponseDto.fromView(view, covers);
  }

  @Query(() => ListSalesOrdersResponseDto, { name: "getStoreSalesOrders" })
  async getStoreSalesOrders(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: ListSalesOrdersInputDto,
  ) {
    const result = await this.crud.list(user.idUsers, input);
    return buildPaginatedListResponse(
      {
        ...result,
        items: result.items.map((item) => SalesOrderResponseDto.fromView(item)),
      },
      RESPONSE_MESSAGES.sales.listed,
    );
  }

  @Query(() => SalesOrderFilterOptionsDto, {
    name: "getStoreSalesOrderFilterOptions",
  })
  async getStoreSalesOrderFilterOptions(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: GetSalesOrderFilterOptionsInputDto,
  ) {
    const options = await this.crud.filterOptions(user.idUsers, input.idStore);
    return SalesOrderFilterOptionsDto.fromView(options);
  }

  @Query(() => SalesOrderResponseDto, { name: "getSalesOrderById" })
  async getSalesOrderById(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: SalesOrderScopeInputDto,
  ) {
    const order = await this.crud.getById(
      user.idUsers,
      input.idStore,
      input.idSalesOrder,
    );
    return await this.toDetailDto(order);
  }

  @Mutation(() => SalesOrderMutationResponseDto, { name: "createSalesOrder" })
  async createSalesOrder(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: CreateSalesOrderInputDto,
  ) {
    const created = await this.crud.create(user.idUsers, input);
    return buildDataResponse(
      await this.toDetailDto(created),
      RESPONSE_MESSAGES.sales.created,
    );
  }

  @Mutation(() => SalesOrderMutationResponseDto, {
    name: "updateSalesOrderHeader",
  })
  async updateSalesOrderHeader(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: UpdateSalesOrderHeaderInputDto,
  ) {
    const updated = await this.crud.updateHeader(user.idUsers, input);
    return buildDataResponse(
      await this.toDetailDto(updated),
      RESPONSE_MESSAGES.sales.updated,
    );
  }

  @Mutation(() => SalesOrderMutationResponseDto, { name: "addSalesOrderItem" })
  async addSalesOrderItem(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: AddSalesOrderItemInputDto,
  ) {
    const updated = await this.crud.addItem(user.idUsers, input);
    return buildDataResponse(
      await this.toDetailDto(updated),
      RESPONSE_MESSAGES.sales.updated,
    );
  }

  @Mutation(() => SalesOrderMutationResponseDto, {
    name: "addSalesOrderItems",
  })
  async addSalesOrderItems(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: AddSalesOrderItemsInputDto,
  ) {
    const updated = await this.crud.addItems(user.idUsers, input);
    return buildDataResponse(
      await this.toDetailDto(updated),
      RESPONSE_MESSAGES.sales.updated,
    );
  }

  @Mutation(() => SalesOrderMutationResponseDto, {
    name: "updateSalesOrderItem",
  })
  async updateSalesOrderItem(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: UpdateSalesOrderItemInputDto,
  ) {
    const updated = await this.crud.updateItem(user.idUsers, input);
    return buildDataResponse(
      await this.toDetailDto(updated),
      RESPONSE_MESSAGES.sales.updated,
    );
  }

  @Mutation(() => SalesOrderMutationResponseDto, {
    name: "removeSalesOrderItem",
  })
  async removeSalesOrderItem(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: RemoveSalesOrderItemInputDto,
  ) {
    const updated = await this.crud.removeItem(
      user.idUsers,
      input.idStore,
      input.idSalesOrder,
      input.idSalesOrderItem,
    );
    return buildDataResponse(
      await this.toDetailDto(updated),
      RESPONSE_MESSAGES.sales.updated,
    );
  }

  @Mutation(() => SalesOrderMutationResponseDto, { name: "confirmSalesOrder" })
  async confirmSalesOrder(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: SalesOrderScopeInputDto,
  ) {
    const confirmed = await this.confirmSalesOrderUseCase.execute(
      user.idUsers,
      input.idStore,
      input.idSalesOrder,
    );
    return buildDataResponse(
      await this.toDetailDto(confirmed),
      RESPONSE_MESSAGES.sales.confirmed,
    );
  }

  @Mutation(() => SalesOrderMutationResponseDto, { name: "cancelSalesOrder" })
  async cancelSalesOrder(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: SalesOrderScopeInputDto,
  ) {
    const cancelled = await this.cancelSalesOrderUseCase.execute(
      user.idUsers,
      input.idStore,
      input.idSalesOrder,
    );
    return buildDataResponse(
      await this.toDetailDto(cancelled),
      RESPONSE_MESSAGES.sales.cancelled,
    );
  }
}
