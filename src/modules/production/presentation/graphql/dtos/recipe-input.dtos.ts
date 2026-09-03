import { Field, Float, InputType, Int } from "@nestjs/graphql";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
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

@InputType()
export class CreateRecipeInputDto {
  @Field()
  @IsUUID()
  idStore!: string;

  @Field()
  @IsUUID()
  idOutputProduct!: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  name?: string;

  @Field(() => Float)
  @IsNumber()
  @IsPositive()
  yieldQuantity!: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  laborCost?: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  overheadCost?: number;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

@InputType()
export class RecipeScopeInputDto {
  @Field()
  @IsUUID()
  idStore!: string;

  @Field()
  @IsUUID()
  idRecipe!: string;
}

@InputType()
export class ListRecipesInputDto {
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
  @Max(200)
  limit?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  status?: boolean;
}

@InputType()
export class UpdateRecipeInputDto {
  @Field()
  @IsUUID()
  idStore!: string;

  @Field()
  @IsUUID()
  idRecipe!: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  name?: string;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  yieldQuantity?: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  laborCost?: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  overheadCost?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  status?: boolean;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

@InputType()
export class AddRecipeItemInputDto {
  @Field()
  @IsUUID()
  idStore!: string;

  @Field()
  @IsUUID()
  idRecipe!: string;

  @Field()
  @IsUUID()
  idProduct!: string;

  @Field(() => Float)
  @IsNumber()
  @IsPositive()
  quantity!: number;
}

@InputType()
export class RecipeItemEntryInputDto {
  @Field()
  @IsUUID()
  idProduct!: string;

  @Field(() => Float)
  @IsNumber()
  @IsPositive()
  quantity!: number;
}

@InputType()
export class AddRecipeItemsInputDto {
  @Field()
  @IsUUID()
  idStore!: string;

  @Field()
  @IsUUID()
  idRecipe!: string;

  @Field(() => [RecipeItemEntryInputDto])
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  items!: RecipeItemEntryInputDto[];
}

@InputType()
export class UpdateRecipeItemInputDto {
  @Field()
  @IsUUID()
  idStore!: string;

  @Field()
  @IsUUID()
  idRecipe!: string;

  @Field()
  @IsUUID()
  idRecipeItem!: string;

  @Field(() => Float)
  @IsNumber()
  @IsPositive()
  quantity!: number;
}

@InputType()
export class RemoveRecipeItemInputDto {
  @Field()
  @IsUUID()
  idStore!: string;

  @Field()
  @IsUUID()
  idRecipe!: string;

  @Field()
  @IsUUID()
  idRecipeItem!: string;
}
