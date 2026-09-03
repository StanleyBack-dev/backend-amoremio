import { Field, Float, ObjectType } from "@nestjs/graphql";
import type {
  RecipeItemView,
  RecipeView,
} from "@/modules/production/application/ports/recipe-repository.port";

@ObjectType()
export class RecipeItemResponseDto {
  static fromView(view: RecipeItemView): RecipeItemResponseDto {
    const dto = new RecipeItemResponseDto();
    dto.idRecipeItem = view.idRecipeItem;
    dto.idProduct = view.idProduct;
    dto.productName = view.productName;
    dto.quantity = view.quantity;
    dto.unit = view.unit;
    return dto;
  }

  @Field()
  idRecipeItem!: string;

  @Field()
  idProduct!: string;

  @Field()
  productName!: string;

  @Field(() => Float)
  quantity!: number;

  @Field()
  unit!: string;
}

@ObjectType()
export class RecipeResponseDto {
  static fromView(view: RecipeView): RecipeResponseDto {
    const dto = new RecipeResponseDto();
    dto.idRecipe = view.idRecipe;
    dto.idStore = view.idStore;
    dto.idOutputProduct = view.idOutputProduct;
    dto.outputProductName = view.outputProductName;
    dto.name = view.name;
    dto.yieldQuantity = view.yieldQuantity;
    dto.yieldUnit = view.yieldUnit;
    dto.laborCost = view.laborCost;
    dto.overheadCost = view.overheadCost;
    dto.status = view.status;
    dto.notes = view.notes;
    dto.createdByUserId = view.createdByUserId;
    dto.createdByUserName = view.createdByUserName;
    dto.createdAt = view.createdAt;
    dto.updatedAt = view.updatedAt;
    dto.items = view.items.map((item) => RecipeItemResponseDto.fromView(item));
    return dto;
  }

  @Field()
  idRecipe!: string;

  @Field()
  idStore!: string;

  @Field()
  idOutputProduct!: string;

  @Field()
  outputProductName!: string;

  @Field()
  name!: string;

  @Field(() => Float)
  yieldQuantity!: number;

  @Field()
  yieldUnit!: string;

  @Field(() => Float)
  laborCost!: number;

  @Field(() => Float)
  overheadCost!: number;

  @Field()
  status!: boolean;

  @Field(() => String, { nullable: true })
  notes?: string | null;

  @Field()
  createdByUserId!: string;

  @Field(() => String, { nullable: true })
  createdByUserName?: string | null;

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date)
  updatedAt!: Date;

  @Field(() => [RecipeItemResponseDto])
  items!: RecipeItemResponseDto[];
}
