import { Field, InputType, Int } from "@nestjs/graphql";
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from "class-validator";

@InputType()
export class CreateBrandInputDto {
  @Field()
  @IsUUID()
  idStore!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  status?: boolean;
}

@InputType()
export class UpdateBrandInputDto {
  @Field()
  @IsUUID()
  idStore!: string;

  @Field()
  @IsUUID()
  idBrand!: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  status?: boolean;
}

@InputType()
export class GetBrandByIdInputDto {
  @Field()
  @IsUUID()
  idStore!: string;

  @Field()
  @IsUUID()
  idBrand!: string;
}

@InputType()
export class ListBrandsInputDto {
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

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  search?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  status?: boolean;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsUUID()
  createdByUserId?: string;
}

@InputType()
export class GetBrandFilterOptionsInputDto {
  @Field()
  @IsUUID()
  idStore!: string;
}
