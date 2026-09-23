import { Field, Float, ObjectType } from "@nestjs/graphql";
import type { AttachmentView } from "@/modules/attachments/application/dto/attachment.commands";
import { AttachmentResponseDto } from "@/modules/attachments/presentation/graphql/dtos/attachment-response.dtos";
import type { ProductView } from "@/modules/catalog/application/ports/product-repository.port";
import { PackagingUnit } from "@/modules/catalog/domain/enums/packaging-unit.enum";
import { ProductKind } from "@/modules/catalog/domain/enums/product-kind.enum";
import { UnitOfMeasure } from "@/modules/catalog/domain/enums/unit-of-measure.enum";

@ObjectType()
export class ProductResponseDto {
  // `images` is only loaded where the screen needs it: every image on the
  // detail/update paths, just the cover on lists. Left empty otherwise.
  static fromView(
    view: ProductView,
    images: AttachmentView[] = [],
  ): ProductResponseDto {
    const dto = new ProductResponseDto();
    dto.idProduct = view.idProduct;
    dto.idStore = view.idStore;
    dto.name = view.name;
    dto.sku = view.sku;
    dto.description = view.description;
    dto.brand = view.brand;
    dto.kind = view.kind;
    dto.unit = view.unit;
    dto.packagingUnit = view.packagingUnit;
    dto.packSize = view.packSize;
    dto.salePrice = view.salePrice;
    dto.status = view.status;
    dto.createdByUserId = view.createdByUserId;
    dto.createdByUserName = view.createdByUserName;
    dto.createdAt = view.createdAt;
    dto.updatedAt = view.updatedAt;
    dto.images = images.map((image) => AttachmentResponseDto.fromView(image));
    dto.coverThumbnailUrl = images[0]?.thumbnailUrl ?? null;
    return dto;
  }

  @Field()
  idProduct!: string;

  @Field()
  idStore!: string;

  @Field()
  name!: string;

  @Field(() => String, { nullable: true })
  sku?: string | null;

  @Field(() => String, { nullable: true })
  description?: string | null;

  @Field(() => String, { nullable: true })
  brand?: string | null;

  @Field(() => ProductKind)
  kind!: ProductKind;

  @Field(() => UnitOfMeasure)
  unit!: UnitOfMeasure;

  @Field(() => PackagingUnit)
  packagingUnit!: PackagingUnit;

  @Field(() => Float)
  packSize!: number;

  @Field(() => Float, { nullable: true })
  salePrice?: number | null;

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

  @Field(() => [AttachmentResponseDto], {
    description: "Ordered by position; the first one is the cover.",
  })
  images!: AttachmentResponseDto[];

  @Field(() => String, { nullable: true })
  coverThumbnailUrl?: string | null;
}
