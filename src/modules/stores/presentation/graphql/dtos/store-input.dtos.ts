import { Field, InputType } from "@nestjs/graphql";
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from "class-validator";
import { StoreRole } from "@/modules/stores/domain/enums/store-role.enum";

@InputType()
export class CreateStoreInputDto {
  @Field()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  legalName?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(18)
  cnpj?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  whatsapp?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  email?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  instagram?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  ifoodUrl?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  food99Url?: string;
}

@InputType()
export class UpdateStoreInputDto {
  @Field()
  @IsUUID()
  idStore!: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  legalName?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(18)
  cnpj?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  whatsapp?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  email?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  instagram?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  ifoodUrl?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  food99Url?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  status?: boolean;
}

@InputType()
export class GetStoreByIdInputDto {
  @Field()
  @IsUUID()
  idStore!: string;
}

@InputType()
export class AddStoreMemberInputDto {
  @Field()
  @IsUUID()
  idStore!: string;

  @Field()
  @IsUUID()
  idUsers!: string;

  @Field(() => StoreRole)
  @IsEnum(StoreRole)
  role!: StoreRole;
}

@InputType()
export class UpdateStoreMemberRoleInputDto {
  @Field()
  @IsUUID()
  idStore!: string;

  @Field()
  @IsUUID()
  idUsers!: string;

  @Field(() => StoreRole)
  @IsEnum(StoreRole)
  role!: StoreRole;
}

@InputType()
export class RemoveStoreMemberInputDto {
  @Field()
  @IsUUID()
  idStore!: string;

  @Field()
  @IsUUID()
  idUsers!: string;
}
