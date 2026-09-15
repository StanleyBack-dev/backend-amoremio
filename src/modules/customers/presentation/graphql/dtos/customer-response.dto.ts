import { Field, ObjectType } from "@nestjs/graphql";
import type { CustomerView } from "@/modules/customers/application/ports/customer-repository.port";

@ObjectType()
export class CustomerResponseDto {
  static fromView(view: CustomerView): CustomerResponseDto {
    const dto = new CustomerResponseDto();
    dto.idCustomer = view.idCustomer;
    dto.idStore = view.idStore;
    dto.name = view.name;
    dto.phone = view.phone;
    dto.email = view.email;
    dto.address = view.address;
    dto.notes = view.notes;
    dto.status = view.status;
    dto.createdByUserId = view.createdByUserId;
    dto.createdByUserName = view.createdByUserName;
    dto.createdAt = view.createdAt;
    dto.updatedAt = view.updatedAt;
    return dto;
  }

  @Field()
  idCustomer!: string;

  @Field()
  idStore!: string;

  @Field()
  name!: string;

  @Field(() => String, { nullable: true })
  phone?: string | null;

  @Field(() => String, { nullable: true })
  email?: string | null;

  @Field(() => String, { nullable: true })
  address?: string | null;

  @Field(() => String, { nullable: true })
  notes?: string | null;

  @Field()
  status!: boolean;

  @Field()
  createdByUserId!: string;

  @Field(() => String, { nullable: true })
  createdByUserName?: string | null;

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date)
  updatedAt!: Date;
}
