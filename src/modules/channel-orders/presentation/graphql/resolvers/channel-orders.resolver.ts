import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { RESPONSE_MESSAGES } from "@/common/responses/catalogs/response-messages.catalog";
import { buildDataResponse } from "@/common/responses/helpers/response.helper";
import type { AuthenticatedUser } from "@/modules/auth/domain/interfaces/auth-token-payload.interface";
import { ListUnmappedChannelProductsUseCase } from "@/modules/channel-orders/application/use-cases/list-unmapped-channel-products.use-case";
import { MapChannelProductUseCase } from "@/modules/channel-orders/application/use-cases/map-channel-product.use-case";
import {
  GetUnmappedChannelProductsInputDto,
  MapChannelProductInputDto,
  MapChannelProductResponseDto,
  MapChannelProductResultDto,
  UnmappedChannelProductDto,
} from "@/modules/channel-orders/presentation/graphql/dtos/channel-orders.dtos";

@Resolver()
export class ChannelOrdersResolver {
  constructor(
    private readonly listUnmappedChannelProductsUseCase: ListUnmappedChannelProductsUseCase,
    private readonly mapChannelProductUseCase: MapChannelProductUseCase,
  ) {}

  @Query(() => [UnmappedChannelProductDto], {
    name: "getUnmappedChannelProducts",
  })
  async getUnmappedChannelProducts(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: GetUnmappedChannelProductsInputDto,
  ) {
    const items = await this.listUnmappedChannelProductsUseCase.execute(
      user.idUsers,
      input.idStore,
    );
    return items.map((item) => UnmappedChannelProductDto.fromView(item));
  }

  @Mutation(() => MapChannelProductResponseDto, { name: "mapChannelProduct" })
  async mapChannelProduct(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: MapChannelProductInputDto,
  ) {
    const result = await this.mapChannelProductUseCase.execute(user.idUsers, {
      idStore: input.idStore,
      channel: input.channel,
      externalProductId: input.externalProductId,
      externalProductName: input.externalProductName,
      idProduct: input.idProduct,
    });
    return buildDataResponse(
      MapChannelProductResultDto.fromResult(result),
      RESPONSE_MESSAGES.channelOrders.productMapped,
    );
  }
}
