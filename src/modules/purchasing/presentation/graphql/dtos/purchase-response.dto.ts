import { Field, Float, ObjectType } from "@nestjs/graphql";
import type {
  PurchaseItemView,
  PurchaseView,
} from "@/modules/purchasing/application/ports/purchase-repository.port";
import { PurchaseDiscountMode } from "@/modules/purchasing/domain/enums/purchase-discount-mode.enum";
import { PurchaseStatus } from "@/modules/purchasing/domain/enums/purchase-status.enum";

@ObjectType()
export class PurchaseItemResponseDto {
  static fromView(view: PurchaseItemView): PurchaseItemResponseDto {
    const dto = new PurchaseItemResponseDto();
    dto.idPurchaseItem = view.idPurchaseItem;
    dto.idProduct = view.idProduct;
    dto.productName = view.productName;
    dto.purchasedQuantity = view.purchasedQuantity;
    dto.purchasedUnit = view.purchasedUnit;
    dto.conversionFactor = view.conversionFactor;
    dto.unitPrice = view.unitPrice;
    dto.lineTotal = view.lineTotal;
    dto.baseQuantity = view.baseQuantity;
    dto.effectiveUnitCost = view.effectiveUnitCost;
    return dto;
  }

  @Field()
  idPurchaseItem!: string;

  @Field()
  idProduct!: string;

  @Field()
  productName!: string;

  @Field(() => Float)
  purchasedQuantity!: number;

  @Field()
  purchasedUnit!: string;

  @Field(() => Float)
  conversionFactor!: number;

  @Field(() => Float)
  unitPrice!: number;

  @Field(() => Float)
  lineTotal!: number;

  @Field(() => Float)
  baseQuantity!: number;

  @Field(() => Float)
  effectiveUnitCost!: number;
}

@ObjectType()
export class PurchaseResponseDto {
  static fromView(view: PurchaseView): PurchaseResponseDto {
    const dto = new PurchaseResponseDto();
    dto.idPurchase = view.idPurchase;
    dto.idStore = view.idStore;
    dto.supplierName = view.supplierName;
    dto.purchaseDate = view.purchaseDate;
    dto.status = view.status;
    dto.freightAmount = view.freightAmount;
    dto.discountAmount = view.discountAmount;
    dto.discountMode = view.discountMode;
    dto.discountPercent = view.discountPercent;
    dto.itemsSubtotal = view.itemsSubtotal;
    dto.total = view.total;
    dto.notes = view.notes;
    dto.createdByUserId = view.createdByUserId;
    dto.createdByUserName = view.createdByUserName;
    dto.finalizedAt = view.finalizedAt;
    dto.createdAt = view.createdAt;
    dto.updatedAt = view.updatedAt;
    dto.items = view.items.map((item) =>
      PurchaseItemResponseDto.fromView(item),
    );
    return dto;
  }

  @Field()
  idPurchase!: string;

  @Field()
  idStore!: string;

  @Field(() => String, { nullable: true })
  supplierName?: string | null;

  @Field(() => Date)
  purchaseDate!: Date;

  @Field(() => PurchaseStatus)
  status!: PurchaseStatus;

  @Field(() => Float)
  freightAmount!: number;

  @Field(() => Float)
  discountAmount!: number;

  @Field(() => PurchaseDiscountMode)
  discountMode!: PurchaseDiscountMode;

  @Field(() => Float)
  discountPercent!: number;

  @Field(() => Float)
  itemsSubtotal!: number;

  @Field(() => Float)
  total!: number;

  @Field(() => String, { nullable: true })
  notes?: string | null;

  @Field()
  createdByUserId!: string;

  @Field(() => String, { nullable: true })
  createdByUserName?: string | null;

  @Field(() => Date, { nullable: true })
  finalizedAt?: Date | null;

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date)
  updatedAt!: Date;

  @Field(() => [PurchaseItemResponseDto])
  items!: PurchaseItemResponseDto[];
}
