import { Field, Float, ObjectType } from "@nestjs/graphql";
import type {
  SalesOrderItemView,
  SalesOrderView,
} from "@/modules/sales/application/ports/sales-order-repository.port";
import { ProductKind } from "@/modules/catalog/domain/enums/product-kind.enum";
import { SalesChannel } from "@/modules/sales/domain/enums/sales-channel.enum";
import { SalesDiscountMode } from "@/modules/sales/domain/enums/sales-discount-mode.enum";
import { SalesOrderStatus } from "@/modules/sales/domain/enums/sales-order-status.enum";

@ObjectType()
export class SalesOrderItemResponseDto {
  static fromView(view: SalesOrderItemView): SalesOrderItemResponseDto {
    const dto = new SalesOrderItemResponseDto();
    dto.idSalesOrderItem = view.idSalesOrderItem;
    dto.idProduct = view.idProduct;
    dto.productName = view.productName;
    dto.productKind = view.productKind;
    dto.quantity = view.quantity;
    dto.unitPrice = view.unitPrice;
    dto.lineTotal = view.lineTotal;
    return dto;
  }

  @Field()
  idSalesOrderItem!: string;

  @Field()
  idProduct!: string;

  @Field()
  productName!: string;

  @Field(() => ProductKind)
  productKind!: ProductKind;

  @Field(() => Float)
  quantity!: number;

  @Field(() => Float)
  unitPrice!: number;

  @Field(() => Float)
  lineTotal!: number;
}

@ObjectType()
export class SalesOrderResponseDto {
  static fromView(view: SalesOrderView): SalesOrderResponseDto {
    const dto = new SalesOrderResponseDto();
    dto.idSalesOrder = view.idSalesOrder;
    dto.idStore = view.idStore;
    dto.customerName = view.customerName;
    dto.orderDate = view.orderDate;
    dto.status = view.status;
    dto.salesChannel = view.salesChannel;
    dto.commissionPercent = view.commissionPercent;
    dto.commissionAmount = view.commissionAmount;
    dto.netTotal = view.netTotal;
    dto.discountAmount = view.discountAmount;
    dto.discountMode = view.discountMode;
    dto.discountPercent = view.discountPercent;
    dto.itemsSubtotal = view.itemsSubtotal;
    dto.total = view.total;
    dto.notes = view.notes;
    dto.createdByUserId = view.createdByUserId;
    dto.createdByUserName = view.createdByUserName;
    dto.confirmedAt = view.confirmedAt;
    dto.createdAt = view.createdAt;
    dto.updatedAt = view.updatedAt;
    dto.items = view.items.map((item) =>
      SalesOrderItemResponseDto.fromView(item),
    );
    return dto;
  }

  @Field()
  idSalesOrder!: string;

  @Field()
  idStore!: string;

  @Field(() => String, { nullable: true })
  customerName?: string | null;

  @Field(() => Date)
  orderDate!: Date;

  @Field(() => SalesOrderStatus)
  status!: SalesOrderStatus;

  @Field(() => SalesChannel)
  salesChannel!: SalesChannel;

  @Field(() => Float)
  commissionPercent!: number;

  @Field(() => Float)
  commissionAmount!: number;

  @Field(() => Float)
  netTotal!: number;

  @Field(() => Float)
  discountAmount!: number;

  @Field(() => SalesDiscountMode)
  discountMode!: SalesDiscountMode;

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
  confirmedAt?: Date | null;

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date)
  updatedAt!: Date;

  @Field(() => [SalesOrderItemResponseDto])
  items!: SalesOrderItemResponseDto[];
}
