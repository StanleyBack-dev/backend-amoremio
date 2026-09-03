import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { RESPONSE_MESSAGES } from "@/common/responses/catalogs/response-messages.catalog";
import { buildDataResponse } from "@/common/responses/helpers/response.helper";
import type { AuthenticatedUser } from "@/modules/auth/domain/interfaces/auth-token-payload.interface";
import { CreateStoreUseCase } from "@/modules/stores/application/use-cases/create/create-store.use-case";
import { GetStoreByIdUseCase } from "@/modules/stores/application/use-cases/get/get-store-by-id.use-case";
import { ListMyStoresUseCase } from "@/modules/stores/application/use-cases/get/list-my-stores.use-case";
import { ListStoreMembersUseCase } from "@/modules/stores/application/use-cases/get/list-store-members.use-case";
import { UpdateStoreUseCase } from "@/modules/stores/application/use-cases/update/update-store.use-case";
import { AddStoreMemberUseCase } from "@/modules/stores/application/use-cases/membership/add-store-member.use-case";
import { UpdateStoreMemberRoleUseCase } from "@/modules/stores/application/use-cases/membership/update-store-member-role.use-case";
import { RemoveStoreMemberUseCase } from "@/modules/stores/application/use-cases/membership/remove-store-member.use-case";
import { StoreResponseDto } from "@/modules/stores/presentation/graphql/dtos/store-response.dto";
import { StoreMemberResponseDto } from "@/modules/stores/presentation/graphql/dtos/store-member-response.dto";
import { StoreMutationResponseDto } from "@/modules/stores/presentation/graphql/dtos/store-mutation-response.dtos";
import {
  AddStoreMemberInputDto,
  CreateStoreInputDto,
  GetStoreByIdInputDto,
  RemoveStoreMemberInputDto,
  UpdateStoreInputDto,
  UpdateStoreMemberRoleInputDto,
} from "@/modules/stores/presentation/graphql/dtos/store-input.dtos";
import "@/modules/stores/presentation/graphql/enums/stores-graphql.enums";

@Resolver()
export class StoresResolver {
  constructor(
    private readonly createStoreUseCase: CreateStoreUseCase,
    private readonly listMyStoresUseCase: ListMyStoresUseCase,
    private readonly getStoreByIdUseCase: GetStoreByIdUseCase,
    private readonly updateStoreUseCase: UpdateStoreUseCase,
    private readonly listStoreMembersUseCase: ListStoreMembersUseCase,
    private readonly addStoreMemberUseCase: AddStoreMemberUseCase,
    private readonly updateStoreMemberRoleUseCase: UpdateStoreMemberRoleUseCase,
    private readonly removeStoreMemberUseCase: RemoveStoreMemberUseCase,
  ) {}

  @Query(() => [StoreResponseDto], { name: "getMyStores" })
  async getMyStores(@CurrentUser() user: AuthenticatedUser) {
    const stores = await this.listMyStoresUseCase.execute(user.idUsers);
    return stores.map((store) => StoreResponseDto.fromViewWithRole(store));
  }

  @Query(() => StoreResponseDto, { name: "getStoreById" })
  async getStoreById(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: GetStoreByIdInputDto,
  ) {
    const store = await this.getStoreByIdUseCase.execute(
      user.idUsers,
      input.idStore,
    );
    return StoreResponseDto.fromView(store);
  }

  @Query(() => [StoreMemberResponseDto], { name: "getStoreMembers" })
  async getStoreMembers(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: GetStoreByIdInputDto,
  ) {
    const members = await this.listStoreMembersUseCase.execute(
      user.idUsers,
      input.idStore,
    );
    return members.map((member) => StoreMemberResponseDto.fromView(member));
  }

  @Mutation(() => StoreMutationResponseDto, { name: "createStore" })
  async createStore(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: CreateStoreInputDto,
  ) {
    const created = await this.createStoreUseCase.execute(user.idUsers, {
      name: input.name,
      legalName: input.legalName,
      cnpj: input.cnpj,
      whatsapp: input.whatsapp,
      email: input.email,
      instagram: input.instagram,
      ifoodUrl: input.ifoodUrl,
      food99Url: input.food99Url,
    });

    return buildDataResponse(
      StoreResponseDto.fromViewWithRole(created),
      RESPONSE_MESSAGES.stores.created,
    );
  }

  @Mutation(() => StoreMutationResponseDto, { name: "updateStore" })
  async updateStore(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: UpdateStoreInputDto,
  ) {
    const updated = await this.updateStoreUseCase.execute(user.idUsers, {
      idStore: input.idStore,
      name: input.name,
      legalName: input.legalName,
      cnpj: input.cnpj,
      whatsapp: input.whatsapp,
      email: input.email,
      instagram: input.instagram,
      ifoodUrl: input.ifoodUrl,
      food99Url: input.food99Url,
      status: input.status,
    });

    return buildDataResponse(
      StoreResponseDto.fromView(updated),
      RESPONSE_MESSAGES.stores.updated,
    );
  }

  @Mutation(() => [StoreMemberResponseDto], { name: "addStoreMember" })
  async addStoreMember(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: AddStoreMemberInputDto,
  ) {
    const members = await this.addStoreMemberUseCase.execute(user.idUsers, {
      idStore: input.idStore,
      idUsers: input.idUsers,
      role: input.role,
    });
    return members.map((member) => StoreMemberResponseDto.fromView(member));
  }

  @Mutation(() => [StoreMemberResponseDto], { name: "updateStoreMemberRole" })
  async updateStoreMemberRole(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: UpdateStoreMemberRoleInputDto,
  ) {
    const members = await this.updateStoreMemberRoleUseCase.execute(
      user.idUsers,
      {
        idStore: input.idStore,
        idUsers: input.idUsers,
        role: input.role,
      },
    );
    return members.map((member) => StoreMemberResponseDto.fromView(member));
  }

  @Mutation(() => [StoreMemberResponseDto], { name: "removeStoreMember" })
  async removeStoreMember(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: RemoveStoreMemberInputDto,
  ) {
    const members = await this.removeStoreMemberUseCase.execute(user.idUsers, {
      idStore: input.idStore,
      idUsers: input.idUsers,
    });
    return members.map((member) => StoreMemberResponseDto.fromView(member));
  }
}
