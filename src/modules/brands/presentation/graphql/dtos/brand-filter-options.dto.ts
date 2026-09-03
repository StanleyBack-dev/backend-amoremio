import { Field, ObjectType } from "@nestjs/graphql";
import { UserOptionDto } from "@/common/responses/dtos/user-option.dto";
import type { BrandFilterOptions } from "@/modules/brands/application/ports/brand-repository.port";

@ObjectType()
export class BrandFilterOptionsDto {
  static fromView(view: BrandFilterOptions): BrandFilterOptionsDto {
    const dto = new BrandFilterOptionsDto();
    dto.names = view.names;
    dto.creators = view.creators.map((creator) => UserOptionDto.from(creator));
    return dto;
  }

  @Field(() => [String])
  names!: string[];

  @Field(() => [UserOptionDto])
  creators!: UserOptionDto[];
}
