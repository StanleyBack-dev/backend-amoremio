import { Int, ObjectType, Field } from "@nestjs/graphql";
import { UserGroup } from "@/modules/users/domain/enums/user-group.enum";
import { AuthCredentialEntity } from "@/modules/auth/infrastructure/persistence/typeorm/entities/auth-credential.entity";
import type { UserEntity } from "@/modules/users/infrastructure/persistence/typeorm/entities/user.entity";
import { toLocalNaiveIsoString } from "@/common/utils/date.util";

@ObjectType()
export class GetUserResponseDto {
  static fromEntity(
    entity: UserEntity,
    credential?: AuthCredentialEntity | null,
  ) {
    const dto = new GetUserResponseDto();
    dto.idUsers = entity.idUsers;
    dto.name = entity.name;
    dto.email = entity.email;
    dto.urlAvatar = entity.urlAvatar;
    dto.status = entity.status;
    dto.group = entity.group;
    dto.inactivatedAt = toLocalNaiveIsoString(entity.inactivatedAt);
    dto.createdAt = toLocalNaiveIsoString(entity.createdAt) as string;
    dto.updatedAt = toLocalNaiveIsoString(entity.updatedAt) as string;
    dto.username = credential?.username;
    dto.mustChangePassword = credential?.mustChangePassword;
    dto.lastLoginAt = toLocalNaiveIsoString(credential?.lastLoginAt);
    dto.failedLoginAttempts = credential?.failedLoginAttempts;
    dto.lockedUntil = toLocalNaiveIsoString(credential?.lockUntil);
    return dto;
  }

  @Field()
  idUsers!: string;

  @Field()
  name!: string;

  @Field()
  email!: string;

  @Field({ nullable: true })
  username?: string;

  @Field({ nullable: true })
  urlAvatar?: string;

  @Field()
  status!: boolean;

  @Field(() => UserGroup)
  group!: UserGroup;

  @Field({ nullable: true })
  inactivatedAt?: string;

  @Field({ nullable: true })
  mustChangePassword?: boolean;

  @Field({ nullable: true })
  lastLoginAt?: string;

  @Field(() => Int, { nullable: true })
  failedLoginAttempts?: number;

  @Field({ nullable: true })
  lockedUntil?: string;

  @Field()
  createdAt!: string;

  @Field()
  updatedAt!: string;
}
