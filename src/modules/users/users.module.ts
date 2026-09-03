import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthCredentialEntity } from "@/modules/auth/infrastructure/persistence/typeorm/entities/auth-credential.entity";
import { UserPageAccessEntity } from "@/modules/auth/infrastructure/persistence/typeorm/entities/user-page-access.entity";
import { AuthModule } from "@/modules/auth/auth.module";
import { MailModule } from "@/modules/mails/mail.module";
import { UserEntity } from "@/modules/users/infrastructure/persistence/typeorm/entities/user.entity";
import { UserExistsValidator } from "@/modules/users/application/validators/user-exists.validator";
import { CreateUserUseCase } from "@/modules/users/application/use-cases/create/create-user.use-case";
import { GetUsersUseCase } from "@/modules/users/application/use-cases/get/get-users.use-case";
import { UserPageAccessUseCase } from "@/modules/users/application/use-cases/permissions/user-page-access.use-case";
import { AdminUpdateUserAccessUseCase } from "@/modules/users/application/use-cases/update/admin-update-user-access.use-case";
import { UnlockUserCredentialUseCase } from "@/modules/users/application/use-cases/update/unlock-user-credential.use-case";
import { UpdateUserLoginUseCase } from "@/modules/users/application/use-cases/update/update-user-login.use-case";
import { UpdateUserUseCase } from "@/modules/users/application/use-cases/update/update-user.use-case";
import { CreateUserResolver } from "@/modules/users/presentation/graphql/resolvers/create/create-user.resolver";
import { GetUsersResolver } from "@/modules/users/presentation/graphql/resolvers/get/get-users.resolver";
import { UserPagePermissionsResolver } from "@/modules/users/presentation/graphql/resolvers/permissions/user-page-permissions.resolver";
import { AdminUpdateUserAccessResolver } from "@/modules/users/presentation/graphql/resolvers/update/admin-update-user-access.resolver";
import { UnlockUserCredentialResolver } from "@/modules/users/presentation/graphql/resolvers/update/unlock-user-credential.resolver";
import { UpdateUserResolver } from "@/modules/users/presentation/graphql/resolvers/update/update-users.resolver";
import "@/modules/users/presentation/graphql/enums/users-graphql.enums";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      AuthCredentialEntity,
      UserPageAccessEntity,
    ]),
    AuthModule,
    MailModule,
  ],
  providers: [
    CreateUserUseCase,
    GetUsersUseCase,
    UpdateUserUseCase,
    AdminUpdateUserAccessUseCase,
    UserPageAccessUseCase,
    UnlockUserCredentialUseCase,
    UpdateUserLoginUseCase,
    UserExistsValidator,
    CreateUserResolver,
    GetUsersResolver,
    UpdateUserResolver,
    AdminUpdateUserAccessResolver,
    UserPagePermissionsResolver,
    UnlockUserCredentialResolver,
  ],
  exports: [
    CreateUserUseCase,
    GetUsersUseCase,
    UpdateUserUseCase,
    UpdateUserLoginUseCase,
  ],
})
export class UsersModule {}
