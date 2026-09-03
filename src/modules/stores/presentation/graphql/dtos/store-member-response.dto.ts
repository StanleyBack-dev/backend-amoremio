import { Field, ObjectType } from "@nestjs/graphql";
import type { StoreMemberView } from "@/modules/stores/application/ports/store-repository.port";
import { StoreRole } from "@/modules/stores/domain/enums/store-role.enum";

@ObjectType()
export class StoreMemberResponseDto {
  static fromView(view: StoreMemberView): StoreMemberResponseDto {
    const dto = new StoreMemberResponseDto();
    dto.idStoreMembership = view.idStoreMembership;
    dto.idStore = view.idStore;
    dto.idUsers = view.idUsers;
    dto.name = view.name;
    dto.email = view.email;
    dto.username = view.username ?? null;
    dto.role = view.role;
    dto.createdAt = view.createdAt;
    dto.updatedAt = view.updatedAt;
    return dto;
  }

  @Field()
  idStoreMembership!: string;

  @Field()
  idStore!: string;

  @Field()
  idUsers!: string;

  @Field()
  name!: string;

  @Field()
  email!: string;

  @Field(() => String, { nullable: true })
  username?: string | null;

  @Field(() => StoreRole)
  role!: StoreRole;

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date)
  updatedAt!: Date;
}
