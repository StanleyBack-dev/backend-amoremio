import { Field, ObjectType } from "@nestjs/graphql";
import { UserOptionDto } from "@/common/responses/dtos/user-option.dto";
import type { ProductFilterOptions } from "@/modules/catalog/application/ports/product-repository.port";

@ObjectType()
export class ProductFilterOptionsDto {
  static fromView(view: ProductFilterOptions): ProductFilterOptionsDto {
    const dto = new ProductFilterOptionsDto();
    dto.names = view.names;
    dto.brands = view.brands;
    dto.creators = view.creators.map((creator) => UserOptionDto.from(creator));
    return dto;
  }

  @Field(() => [String])
  names!: string[];

  @Field(() => [String])
  brands!: string[];

  @Field(() => [UserOptionDto])
  creators!: UserOptionDto[];
}
