import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthCredentialEntity } from "@/modules/auth/infrastructure/persistence/typeorm/entities/auth-credential.entity";
import { UserEntity } from "@/modules/users/infrastructure/persistence/typeorm/entities/user.entity";
import { STORE_REPOSITORY } from "@/modules/stores/application/ports/store-repository.port";
import { StoreAuthorizationService } from "@/modules/stores/application/use-cases/store-authorization.use-case";
import { StoreBootstrapService } from "@/modules/stores/application/use-cases/store-bootstrap.use-case";
import { CreateStoreUseCase } from "@/modules/stores/application/use-cases/create/create-store.use-case";
import { GetStoreByIdUseCase } from "@/modules/stores/application/use-cases/get/get-store-by-id.use-case";
import { ListMyStoresUseCase } from "@/modules/stores/application/use-cases/get/list-my-stores.use-case";
import { ListStoreMembersUseCase } from "@/modules/stores/application/use-cases/get/list-store-members.use-case";
import { UpdateStoreUseCase } from "@/modules/stores/application/use-cases/update/update-store.use-case";
import { AddStoreMemberUseCase } from "@/modules/stores/application/use-cases/membership/add-store-member.use-case";
import { UpdateStoreMemberRoleUseCase } from "@/modules/stores/application/use-cases/membership/update-store-member-role.use-case";
import { RemoveStoreMemberUseCase } from "@/modules/stores/application/use-cases/membership/remove-store-member.use-case";
import { StoreEntity } from "@/modules/stores/infrastructure/persistence/typeorm/entities/store.entity";
import { StoreMembershipEntity } from "@/modules/stores/infrastructure/persistence/typeorm/entities/store-membership.entity";
import { StoreTypeormRepository } from "@/modules/stores/infrastructure/persistence/typeorm/repositories/store-typeorm.repository";
import { StoresResolver } from "@/modules/stores/presentation/graphql/resolvers/stores.resolver";
import "@/modules/stores/presentation/graphql/enums/stores-graphql.enums";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      StoreEntity,
      StoreMembershipEntity,
      UserEntity,
      AuthCredentialEntity,
    ]),
  ],
  providers: [
    StoreTypeormRepository,
    { provide: STORE_REPOSITORY, useExisting: StoreTypeormRepository },
    StoreAuthorizationService,
    StoreBootstrapService,
    CreateStoreUseCase,
    ListMyStoresUseCase,
    GetStoreByIdUseCase,
    UpdateStoreUseCase,
    ListStoreMembersUseCase,
    AddStoreMemberUseCase,
    UpdateStoreMemberRoleUseCase,
    RemoveStoreMemberUseCase,
    StoresResolver,
  ],
  exports: [STORE_REPOSITORY, StoreAuthorizationService],
})
export class StoresModule {}
