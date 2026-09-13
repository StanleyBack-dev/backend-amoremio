import { Field, Float, InputType, Int } from "@nestjs/graphql";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from "class-validator";
import { ShoppingListStatus } from "@/modules/shopping-list/domain/enums/shopping-list-status.enum";

@InputType()
export class CreateShoppingListInputDto {
  @Field()
  @IsUUID()
  idStore!: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  name?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

@InputType()
export class ShoppingListScopeInputDto {
  @Field()
  @IsUUID()
  idStore!: string;

  @Field()
  @IsUUID()
  idShoppingList!: string;
}

@InputType()
export class GetShoppingListByPurchaseIdInputDto {
  @Field()
  @IsUUID()
  idStore!: string;

  @Field()
  @IsUUID()
  idPurchase!: string;
}

@InputType()
export class ListShoppingListsInputDto {
  @Field()
  @IsUUID()
  idStore!: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @Field(() => ShoppingListStatus, { nullable: true })
  @IsOptional()
  @IsEnum(ShoppingListStatus)
  status?: ShoppingListStatus;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsUUID()
  createdByUserId?: string;
}

@InputType()
export class AddShoppingListItemInputDto {
  @Field()
  @IsUUID()
  idStore!: string;

  @Field()
  @IsUUID()
  idShoppingList!: string;

  @Field()
  @IsUUID()
  idProduct!: string;

  @Field(() => Float)
  @IsNumber()
  @IsPositive()
  desiredQuantity!: number;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

@InputType()
export class ShoppingListItemEntryInputDto {
  @Field()
  @IsUUID()
  idProduct!: string;

  @Field(() => Float)
  @IsNumber()
  @IsPositive()
  desiredQuantity!: number;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

@InputType()
export class AddShoppingListItemsInputDto {
  @Field()
  @IsUUID()
  idStore!: string;

  @Field()
  @IsUUID()
  idShoppingList!: string;

  @Field(() => [ShoppingListItemEntryInputDto])
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  items!: ShoppingListItemEntryInputDto[];
}

@InputType()
export class UpdateShoppingListItemInputDto {
  @Field()
  @IsUUID()
  idStore!: string;

  @Field()
  @IsUUID()
  idShoppingList!: string;

  @Field()
  @IsUUID()
  idShoppingListItem!: string;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  desiredQuantity?: number;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;

  // Checklist flag, ticked from the linked purchase's screen — valid even
  // after the list has been converted (see UpdateShoppingListItemUseCase).
  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  purchased?: boolean;
}

@InputType()
export class RemoveShoppingListItemInputDto {
  @Field()
  @IsUUID()
  idStore!: string;

  @Field()
  @IsUUID()
  idShoppingList!: string;

  @Field()
  @IsUUID()
  idShoppingListItem!: string;
}
