import { Field, ObjectType } from "@nestjs/graphql";
import type {
  StoreView,
  StoreWithRoleView,
} from "@/modules/stores/application/ports/store-repository.port";
import { StoreRole } from "@/modules/stores/domain/enums/store-role.enum";

@ObjectType()
export class StoreResponseDto {
  static fromView(view: StoreView, role?: StoreRole | null): StoreResponseDto {
    const dto = new StoreResponseDto();
    dto.idStore = view.idStore;
    dto.name = view.name;
    dto.legalName = view.legalName ?? null;
    dto.cnpj = view.cnpj ?? null;
    dto.whatsapp = view.whatsapp ?? null;
    dto.email = view.email ?? null;
    dto.instagram = view.instagram ?? null;
    dto.ifoodUrl = view.ifoodUrl ?? null;
    dto.food99Url = view.food99Url ?? null;
    dto.status = view.status;
    dto.createdByUserId = view.createdByUserId;
    dto.createdAt = view.createdAt;
    dto.updatedAt = view.updatedAt;
    dto.role = role ?? null;
    return dto;
  }

  static fromViewWithRole(view: StoreWithRoleView): StoreResponseDto {
    return StoreResponseDto.fromView(view, view.role);
  }

  @Field()
  idStore!: string;

  @Field()
  name!: string;

  @Field(() => String, { nullable: true })
  legalName?: string | null;

  @Field(() => String, { nullable: true })
  cnpj?: string | null;

  @Field(() => String, { nullable: true })
  whatsapp?: string | null;

  @Field(() => String, { nullable: true })
  email?: string | null;

  @Field(() => String, { nullable: true })
  instagram?: string | null;

  @Field(() => String, { nullable: true })
  ifoodUrl?: string | null;

  @Field(() => String, { nullable: true })
  food99Url?: string | null;

  @Field()
  status!: boolean;

  @Field()
  createdByUserId!: string;

  // The caller's role in this store (null for a platform ADMIN_MASTER who
  // has no explicit membership).
  @Field(() => StoreRole, { nullable: true })
  role?: StoreRole | null;

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date)
  updatedAt!: Date;
}
