import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { RESPONSE_MESSAGES } from "@/common/responses/catalogs/response-messages.catalog";
import {
  buildDataResponse,
  buildPaginatedListResponse,
} from "@/common/responses/helpers/response.helper";
import type { AuthenticatedUser } from "@/modules/auth/domain/interfaces/auth-token-payload.interface";
import { CreateSupplierUseCase } from "@/modules/suppliers/application/use-cases/create-supplier.use-case";
import { UpdateSupplierUseCase } from "@/modules/suppliers/application/use-cases/update-supplier.use-case";
import { GetSupplierByIdUseCase } from "@/modules/suppliers/application/use-cases/get-supplier-by-id.use-case";
import { ListSuppliersUseCase } from "@/modules/suppliers/application/use-cases/list-suppliers.use-case";
import { SupplierResponseDto } from "@/modules/suppliers/presentation/graphql/dtos/supplier-response.dto";
import { SupplierFilterOptionsDto } from "@/modules/suppliers/presentation/graphql/dtos/supplier-filter-options.dto";
import {
  ListSuppliersResponseDto,
  SupplierMutationResponseDto,
} from "@/modules/suppliers/presentation/graphql/dtos/supplier-list-response.dto";
import {
  CreateSupplierInputDto,
  GetSupplierByIdInputDto,
  GetSupplierFilterOptionsInputDto,
  ListSuppliersInputDto,
  UpdateSupplierInputDto,
} from "@/modules/suppliers/presentation/graphql/dtos/supplier-input.dtos";

@Resolver()
export class SuppliersResolver {
  constructor(
    private readonly createSupplierUseCase: CreateSupplierUseCase,
    private readonly updateSupplierUseCase: UpdateSupplierUseCase,
    private readonly getSupplierByIdUseCase: GetSupplierByIdUseCase,
    private readonly listSuppliersUseCase: ListSuppliersUseCase,
  ) {}

  @Query(() => ListSuppliersResponseDto, { name: "getStoreSuppliers" })
  async getStoreSuppliers(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: ListSuppliersInputDto,
  ) {
    const result = await this.listSuppliersUseCase.execute(
      user.idUsers,
      input,
    );
    return buildPaginatedListResponse(
      {
        ...result,
        items: result.items.map((item) =>
          SupplierResponseDto.fromView(item),
        ),
      },
      RESPONSE_MESSAGES.suppliers.listed,
    );
  }

  @Query(() => SupplierFilterOptionsDto, {
    name: "getStoreSupplierFilterOptions",
  })
  async getStoreSupplierFilterOptions(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: GetSupplierFilterOptionsInputDto,
  ) {
    const options = await this.listSuppliersUseCase.filterOptions(
      user.idUsers,
      input.idStore,
    );
    return SupplierFilterOptionsDto.fromView(options);
  }

  @Query(() => SupplierResponseDto, { name: "getSupplierById" })
  async getSupplierById(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: GetSupplierByIdInputDto,
  ) {
    const supplier = await this.getSupplierByIdUseCase.execute(
      user.idUsers,
      input.idStore,
      input.idSupplier,
    );
    return SupplierResponseDto.fromView(supplier);
  }

  @Mutation(() => SupplierMutationResponseDto, { name: "createSupplier" })
  async createSupplier(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: CreateSupplierInputDto,
  ) {
    const created = await this.createSupplierUseCase.execute(user.idUsers, {
      idStore: input.idStore,
      name: input.name,
      phone: input.phone,
      email: input.email,
      address: input.address,
      instagram: input.instagram,
      document: input.document,
      notes: input.notes,
      status: input.status,
    });
    return buildDataResponse(
      SupplierResponseDto.fromView(created),
      RESPONSE_MESSAGES.suppliers.created,
    );
  }

  @Mutation(() => SupplierMutationResponseDto, { name: "updateSupplier" })
  async updateSupplier(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: UpdateSupplierInputDto,
  ) {
    const updated = await this.updateSupplierUseCase.execute(user.idUsers, {
      idStore: input.idStore,
      idSupplier: input.idSupplier,
      name: input.name,
      phone: input.phone,
      email: input.email,
      address: input.address,
      instagram: input.instagram,
      document: input.document,
      notes: input.notes,
      status: input.status,
    });
    return buildDataResponse(
      SupplierResponseDto.fromView(updated),
      RESPONSE_MESSAGES.suppliers.updated,
    );
  }
}
