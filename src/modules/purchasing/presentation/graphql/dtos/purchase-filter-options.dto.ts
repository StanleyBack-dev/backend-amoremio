import { Field, ObjectType } from "@nestjs/graphql";
import { UserOptionDto } from "@/common/responses/dtos/user-option.dto";
import type { PurchaseFilterOptions } from "@/modules/purchasing/application/ports/purchase-repository.port";

@ObjectType()
export class PurchaseFilterOptionsDto {
  static fromView(view: PurchaseFilterOptions): PurchaseFilterOptionsDto {
    const dto = new PurchaseFilterOptionsDto();
    dto.suppliers = view.suppliers;
    dto.creators = view.creators.map((creator) =>
      UserOptionDto.from(creator),
    );
    return dto;
  }

  @Field(() => [String])
  suppliers!: string[];

  @Field(() => [UserOptionDto])
  creators!: UserOptionDto[];
}
