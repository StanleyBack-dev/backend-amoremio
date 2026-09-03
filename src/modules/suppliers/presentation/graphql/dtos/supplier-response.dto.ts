import { Field, ObjectType } from "@nestjs/graphql";
import type { SupplierView } from "@/modules/suppliers/application/ports/supplier-repository.port";

@ObjectType()
export class SupplierResponseDto {
  static fromView(view: SupplierView): SupplierResponseDto {
    const dto = new SupplierResponseDto();
    dto.idSupplier = view.idSupplier;
    dto.idStore = view.idStore;
    dto.name = view.name;
    dto.phone = view.phone;
    dto.email = view.email;
    dto.address = view.address;
    dto.instagram = view.instagram;
    dto.document = view.document;
    dto.notes = view.notes;
    dto.status = view.status;
    dto.createdByUserId = view.createdByUserId;
    dto.createdByUserName = view.createdByUserName;
    dto.createdAt = view.createdAt;
    dto.updatedAt = view.updatedAt;
    return dto;
  }

  @Field()
  idSupplier!: string;

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
  instagram?: string | null;

  @Field(() => String, { nullable: true })
  document?: string | null;

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
