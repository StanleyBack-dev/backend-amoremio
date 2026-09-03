import { Field, InputType, Int } from "@nestjs/graphql";
import {
  IsBoolean,
  IsEmail,
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
export class CreateSupplierInputDto {
  @Field()
  @IsUUID()
  idStore!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  name!: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsEmail()
  @MaxLength(160)
  email?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  instagram?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  document?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  status?: boolean;
}

@InputType()
export class UpdateSupplierInputDto {
  @Field()
  @IsUUID()
  idStore!: string;

  @Field()
  @IsUUID()
  idSupplier!: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  name?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  email?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  instagram?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  document?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  status?: boolean;
}

@InputType()
export class GetSupplierByIdInputDto {
  @Field()
  @IsUUID()
  idStore!: string;

  @Field()
  @IsUUID()
  idSupplier!: string;
}

@InputType()
export class ListSuppliersInputDto {
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
  @MaxLength(160)
  name?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsUUID()
  createdByUserId?: string;
}

@InputType()
export class GetSupplierFilterOptionsInputDto {
  @Field()
  @IsUUID()
  idStore!: string;
}
