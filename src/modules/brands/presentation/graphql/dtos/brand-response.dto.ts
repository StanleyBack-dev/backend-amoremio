import { Field, ObjectType } from "@nestjs/graphql";
import type { BrandView } from "@/modules/brands/application/ports/brand-repository.port";

@ObjectType()
export class BrandResponseDto {
  static fromView(view: BrandView): BrandResponseDto {
    const dto = new BrandResponseDto();
    dto.idBrand = view.idBrand;
    dto.idStore = view.idStore;
    dto.name = view.name;
    dto.status = view.status;
    dto.createdByUserId = view.createdByUserId;
    dto.createdByUserName = view.createdByUserName;
    dto.createdAt = view.createdAt;
    dto.updatedAt = view.updatedAt;
    return dto;
  }

  @Field()
  idBrand!: string;

  @Field()
  idStore!: string;

  @Field()
  name!: string;

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
