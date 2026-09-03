import { Field, ObjectType } from "@nestjs/graphql";
import { UserOptionDto } from "@/common/responses/dtos/user-option.dto";
import { SalesChannel } from "@/modules/sales/domain/enums/sales-channel.enum";
import type { SalesOrderFilterOptions } from "@/modules/sales/application/ports/sales-order-repository.port";

@ObjectType()
export class SalesOrderFilterOptionsDto {
  static fromView(view: SalesOrderFilterOptions): SalesOrderFilterOptionsDto {
    const dto = new SalesOrderFilterOptionsDto();
    dto.customers = view.customers;
    dto.channels = view.channels;
    dto.creators = view.creators.map((creator) => UserOptionDto.from(creator));
    return dto;
  }

  @Field(() => [String])
  customers!: string[];

  @Field(() => [SalesChannel])
  channels!: SalesChannel[];

  @Field(() => [UserOptionDto])
  creators!: UserOptionDto[];
}
