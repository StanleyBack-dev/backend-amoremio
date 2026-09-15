import { Field, ObjectType } from "@nestjs/graphql";
import { UserOptionDto } from "@/common/responses/dtos/user-option.dto";
import type { CustomerFilterOptions } from "@/modules/customers/application/ports/customer-repository.port";

@ObjectType()
export class CustomerFilterOptionsDto {
  static fromView(view: CustomerFilterOptions): CustomerFilterOptionsDto {
    const dto = new CustomerFilterOptionsDto();
    dto.names = view.names;
    dto.creators = view.creators.map((creator) => UserOptionDto.from(creator));
    return dto;
  }

  @Field(() => [String])
  names!: string[];

  @Field(() => [UserOptionDto])
  creators!: UserOptionDto[];
}
