import { Field, ObjectType } from "@nestjs/graphql";
import { UserOptionDto } from "@/common/responses/dtos/user-option.dto";
import type { SupplierFilterOptions } from "@/modules/suppliers/application/ports/supplier-repository.port";

@ObjectType()
export class SupplierFilterOptionsDto {
  static fromView(view: SupplierFilterOptions): SupplierFilterOptionsDto {
    const dto = new SupplierFilterOptionsDto();
    dto.names = view.names;
    dto.creators = view.creators.map((creator) =>
      UserOptionDto.from(creator),
    );
    return dto;
  }

  @Field(() => [String])
  names!: string[];

  @Field(() => [UserOptionDto])
  creators!: UserOptionDto[];
}
