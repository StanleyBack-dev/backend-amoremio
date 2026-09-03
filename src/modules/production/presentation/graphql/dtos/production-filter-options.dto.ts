import { Field, ObjectType } from "@nestjs/graphql";
import { UserOptionDto } from "@/common/responses/dtos/user-option.dto";
import type { ProductionOrderFilterOptions } from "@/modules/production/application/ports/production-order-repository.port";

@ObjectType()
export class ProductionOrderFilterOptionsDto {
  static fromView(
    view: ProductionOrderFilterOptions,
  ): ProductionOrderFilterOptionsDto {
    const dto = new ProductionOrderFilterOptionsDto();
    dto.recipes = view.recipes.map((recipe) => UserOptionDto.from(recipe));
    dto.creators = view.creators.map((creator) => UserOptionDto.from(creator));
    return dto;
  }

  @Field(() => [UserOptionDto])
  recipes!: UserOptionDto[];

  @Field(() => [UserOptionDto])
  creators!: UserOptionDto[];
}
