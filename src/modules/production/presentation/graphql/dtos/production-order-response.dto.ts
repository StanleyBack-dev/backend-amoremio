import { Field, Float, ObjectType } from "@nestjs/graphql";
import type {
  ProductionOrderItemView,
  ProductionOrderView,
} from "@/modules/production/application/ports/production-order-repository.port";
import { ProductionOrderStatus } from "@/modules/production/domain/enums/production-order-status.enum";

@ObjectType()
export class ProductionOrderItemResponseDto {
  static fromView(
    view: ProductionOrderItemView,
  ): ProductionOrderItemResponseDto {
    const dto = new ProductionOrderItemResponseDto();
    dto.idProductionOrderItem = view.idProductionOrderItem;
    dto.idProduct = view.idProduct;
    dto.productName = view.productName;
    dto.quantity = view.quantity;
    dto.unit = view.unit;
    dto.unitCostAtConsumption = view.unitCostAtConsumption;
    dto.lineCost = view.lineCost;
    return dto;
  }

  @Field()
  idProductionOrderItem!: string;

  @Field()
  idProduct!: string;

  @Field()
  productName!: string;

  @Field(() => Float)
  quantity!: number;

  @Field()
  unit!: string;

  @Field(() => Float)
  unitCostAtConsumption!: number;

  @Field(() => Float)
  lineCost!: number;
}

@ObjectType()
export class ProductionOrderResponseDto {
  static fromView(view: ProductionOrderView): ProductionOrderResponseDto {
    const dto = new ProductionOrderResponseDto();
    dto.idProductionOrder = view.idProductionOrder;
    dto.idStore = view.idStore;
    dto.idRecipe = view.idRecipe;
    dto.recipeName = view.recipeName;
    dto.idOutputProduct = view.idOutputProduct;
    dto.outputProductName = view.outputProductName;
    dto.productionDate = view.productionDate;
    dto.status = view.status;
    dto.batches = view.batches;
    dto.plannedOutputQuantity = view.plannedOutputQuantity;
    dto.actualOutputQuantity = view.actualOutputQuantity;
    dto.laborCost = view.laborCost;
    dto.overheadCost = view.overheadCost;
    dto.inputsCost = view.inputsCost;
    dto.totalCost = view.totalCost;
    dto.outputUnitCost = view.outputUnitCost;
    dto.notes = view.notes;
    dto.createdByUserId = view.createdByUserId;
    dto.createdByUserName = view.createdByUserName;
    dto.concludedAt = view.concludedAt;
    dto.createdAt = view.createdAt;
    dto.updatedAt = view.updatedAt;
    dto.items = view.items.map((item) =>
      ProductionOrderItemResponseDto.fromView(item),
    );
    return dto;
  }

  @Field()
  idProductionOrder!: string;

  @Field()
  idStore!: string;

  @Field()
  idRecipe!: string;

  @Field()
  recipeName!: string;

  @Field()
  idOutputProduct!: string;

  @Field()
  outputProductName!: string;

  @Field(() => Date)
  productionDate!: Date;

  @Field(() => ProductionOrderStatus)
  status!: ProductionOrderStatus;

  @Field(() => Float)
  batches!: number;

  @Field(() => Float)
  plannedOutputQuantity!: number;

  @Field(() => Float)
  actualOutputQuantity!: number;

  @Field(() => Float)
  laborCost!: number;

  @Field(() => Float)
  overheadCost!: number;

  @Field(() => Float)
  inputsCost!: number;

  @Field(() => Float)
  totalCost!: number;

  @Field(() => Float)
  outputUnitCost!: number;

  @Field(() => String, { nullable: true })
  notes?: string | null;

  @Field()
  createdByUserId!: string;

  @Field(() => String, { nullable: true })
  createdByUserName?: string | null;

  @Field(() => Date, { nullable: true })
  concludedAt?: Date | null;

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date)
  updatedAt!: Date;

  @Field(() => [ProductionOrderItemResponseDto])
  items!: ProductionOrderItemResponseDto[];
}
