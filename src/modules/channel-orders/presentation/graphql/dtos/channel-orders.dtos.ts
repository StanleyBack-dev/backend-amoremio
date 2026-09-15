import { Field, InputType, Int, ObjectType } from "@nestjs/graphql";
import { IsNotEmpty, IsString, IsUUID, MaxLength } from "class-validator";
import { SalesChannel } from "@/modules/sales/domain/enums/sales-channel.enum";
import { createDataResponseDto } from "@/common/responses/factories/create-data-response.dto";
import type { MapChannelProductResult } from "@/modules/channel-orders/application/use-cases/map-channel-product.use-case";
import type { UnmappedChannelProductView } from "@/modules/channel-orders/application/ports/channel-order-repository.port";

@InputType()
export class GetUnmappedChannelProductsInputDto {
  @Field()
  @IsUUID()
  idStore!: string;
}

@ObjectType()
export class UnmappedChannelProductDto {
  static fromView(view: UnmappedChannelProductView): UnmappedChannelProductDto {
    const dto = new UnmappedChannelProductDto();
    dto.channel = view.channel;
    dto.externalProductId = view.externalProductId;
    dto.externalProductName = view.externalProductName;
    dto.pendingEventCount = view.pendingEventCount;
    return dto;
  }

  @Field(() => SalesChannel)
  channel!: SalesChannel;

  @Field()
  externalProductId!: string;

  @Field()
  externalProductName!: string;

  @Field(() => Int)
  pendingEventCount!: number;
}

@InputType()
export class MapChannelProductInputDto {
  @Field()
  @IsUUID()
  idStore!: string;

  @Field(() => SalesChannel)
  channel!: SalesChannel;

  @Field()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  externalProductId!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  externalProductName!: string;

  @Field()
  @IsUUID()
  idProduct!: string;
}

@ObjectType()
export class MapChannelProductResultDto {
  static fromResult(
    result: MapChannelProductResult,
  ): MapChannelProductResultDto {
    const dto = new MapChannelProductResultDto();
    dto.promotedOrders = result.promotedOrders;
    dto.failedOrders = result.failedOrders;
    return dto;
  }

  @Field(() => Int)
  promotedOrders!: number;

  @Field(() => Int)
  failedOrders!: number;
}

export const MapChannelProductResponseDto = createDataResponseDto(
  MapChannelProductResultDto,
  "MapChannelProductResponseDto",
);
