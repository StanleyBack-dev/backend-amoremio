import { Field, Float, ObjectType } from "@nestjs/graphql";
import type {
  StockItemView,
  StockMovementView,
} from "@/modules/inventory/application/ports/inventory-repository.port";
import { ProductKind } from "@/modules/catalog/domain/enums/product-kind.enum";
import { UnitOfMeasure } from "@/modules/catalog/domain/enums/unit-of-measure.enum";
import { StockMovementType } from "@/modules/inventory/domain/enums/stock-movement-type.enum";

@ObjectType()
export class StockItemResponseDto {
  static fromView(view: StockItemView): StockItemResponseDto {
    const dto = new StockItemResponseDto();
    dto.idProduct = view.idProduct;
    dto.idStore = view.idStore;
    dto.productName = view.productName;
    dto.sku = view.sku;
    dto.brand = view.brand;
    dto.kind = view.kind;
    dto.status = view.status;
    dto.unit = view.unit;
    dto.quantityOnHand = view.quantityOnHand;
    dto.averageCost = view.averageCost;
    dto.stockValue = view.stockValue;
    dto.reorderPoint = view.reorderPoint;
    dto.updatedAt = view.updatedAt;
    return dto;
  }

  @Field()
  idProduct!: string;

  @Field()
  idStore!: string;

  @Field()
  productName!: string;

  @Field(() => String, { nullable: true })
  sku?: string | null;

  @Field(() => String, { nullable: true })
  brand?: string | null;

  @Field(() => ProductKind)
  kind!: ProductKind;

  @Field()
  status!: boolean;

  @Field(() => UnitOfMeasure)
  unit!: UnitOfMeasure;

  @Field(() => Float)
  quantityOnHand!: number;

  @Field(() => Float)
  averageCost!: number;

  @Field(() => Float)
  stockValue!: number;

  @Field(() => Float, { nullable: true })
  reorderPoint?: number | null;

  @Field(() => Date, { nullable: true })
  updatedAt?: Date | null;
}

@ObjectType()
export class StockMovementResponseDto {
  static fromView(view: StockMovementView): StockMovementResponseDto {
    const dto = new StockMovementResponseDto();
    dto.idStockMovement = view.idStockMovement;
    dto.idStore = view.idStore;
    dto.idProduct = view.idProduct;
    dto.productName = view.productName;
    dto.unit = view.unit;
    dto.type = view.type;
    dto.quantity = view.quantity;
    dto.unitCost = view.unitCost;
    dto.resultingQuantity = view.resultingQuantity;
    dto.resultingAverageCost = view.resultingAverageCost;
    dto.sourceType = view.sourceType;
    dto.sourceId = view.sourceId;
    dto.note = view.note;
    dto.occurredAt = view.occurredAt;
    return dto;
  }

  @Field()
  idStockMovement!: string;

  @Field()
  idStore!: string;

  @Field()
  idProduct!: string;

  @Field()
  productName!: string;

  @Field(() => UnitOfMeasure)
  unit!: UnitOfMeasure;

  @Field(() => StockMovementType)
  type!: StockMovementType;

  @Field(() => Float)
  quantity!: number;

  @Field(() => Float)
  unitCost!: number;

  @Field(() => Float)
  resultingQuantity!: number;

  @Field(() => Float)
  resultingAverageCost!: number;

  @Field(() => String, { nullable: true })
  sourceType?: string | null;

  @Field(() => String, { nullable: true })
  sourceId?: string | null;

  @Field(() => String, { nullable: true })
  note?: string | null;

  @Field(() => Date)
  occurredAt!: Date;
}
