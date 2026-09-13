import { Field, Float, ObjectType } from "@nestjs/graphql";
import type {
  ShoppingListItemView,
  ShoppingListView,
} from "@/modules/shopping-list/application/ports/shopping-list-repository.port";
import { ShoppingListStatus } from "@/modules/shopping-list/domain/enums/shopping-list-status.enum";

@ObjectType()
export class ShoppingListItemResponseDto {
  static fromView(view: ShoppingListItemView): ShoppingListItemResponseDto {
    const dto = new ShoppingListItemResponseDto();
    dto.idShoppingListItem = view.idShoppingListItem;
    dto.idProduct = view.idProduct;
    dto.productName = view.productName;
    dto.unit = view.unit;
    dto.desiredQuantity = view.desiredQuantity;
    dto.note = view.note;
    dto.purchased = view.purchased;
    return dto;
  }

  @Field()
  idShoppingListItem!: string;

  @Field()
  idProduct!: string;

  @Field()
  productName!: string;

  @Field()
  unit!: string;

  @Field(() => Float)
  desiredQuantity!: number;

  @Field(() => String, { nullable: true })
  note?: string | null;

  @Field()
  purchased!: boolean;
}

@ObjectType()
export class ShoppingListResponseDto {
  static fromView(view: ShoppingListView): ShoppingListResponseDto {
    const dto = new ShoppingListResponseDto();
    dto.idShoppingList = view.idShoppingList;
    dto.idStore = view.idStore;
    dto.name = view.name;
    dto.status = view.status;
    dto.notes = view.notes;
    dto.convertedToPurchaseId = view.convertedToPurchaseId;
    dto.createdByUserId = view.createdByUserId;
    dto.createdByUserName = view.createdByUserName;
    dto.convertedAt = view.convertedAt;
    dto.createdAt = view.createdAt;
    dto.updatedAt = view.updatedAt;
    dto.items = view.items.map((item) =>
      ShoppingListItemResponseDto.fromView(item),
    );
    return dto;
  }

  @Field()
  idShoppingList!: string;

  @Field()
  idStore!: string;

  @Field(() => String, { nullable: true })
  name?: string | null;

  @Field(() => ShoppingListStatus)
  status!: ShoppingListStatus;

  @Field(() => String, { nullable: true })
  notes?: string | null;

  @Field(() => String, { nullable: true })
  convertedToPurchaseId?: string | null;

  @Field()
  createdByUserId!: string;

  @Field(() => String, { nullable: true })
  createdByUserName?: string | null;

  @Field(() => Date, { nullable: true })
  convertedAt?: Date | null;

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date)
  updatedAt!: Date;

  @Field(() => [ShoppingListItemResponseDto])
  items!: ShoppingListItemResponseDto[];
}
