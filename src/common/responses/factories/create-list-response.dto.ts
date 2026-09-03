import { Type } from "@nestjs/common";
import { Field, Int, ObjectType } from "@nestjs/graphql";
import { BaseResponseDto } from "../dtos/base-response.dto";

export function createListResponseDto<TItem>(
  classRef: Type<TItem>,
  name: string,
) {
  @ObjectType(name)
  class ListResponseDto extends BaseResponseDto {
    @Field(() => [classRef])
    items!: TItem[];

    @Field(() => Int)
    total!: number;

    @Field(() => Int)
    currentPage!: number;

    @Field(() => Int)
    limit!: number;

    @Field(() => Int)
    totalPages!: number;

    @Field()
    hasNextPage!: boolean;
  }

  return ListResponseDto;
}
