import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { RESPONSE_MESSAGES } from "@/common/responses/catalogs/response-messages.catalog";
import {
  buildDataResponse,
  buildPaginatedListResponse,
} from "@/common/responses/helpers/response.helper";
import type { AuthenticatedUser } from "@/modules/auth/domain/interfaces/auth-token-payload.interface";
import { CreateBrandUseCase } from "@/modules/brands/application/use-cases/create-brand.use-case";
import { UpdateBrandUseCase } from "@/modules/brands/application/use-cases/update-brand.use-case";
import { GetBrandByIdUseCase } from "@/modules/brands/application/use-cases/get-brand-by-id.use-case";
import { ListBrandsUseCase } from "@/modules/brands/application/use-cases/list-brands.use-case";
import { BrandResponseDto } from "@/modules/brands/presentation/graphql/dtos/brand-response.dto";
import { BrandFilterOptionsDto } from "@/modules/brands/presentation/graphql/dtos/brand-filter-options.dto";
import {
  BrandMutationResponseDto,
  ListBrandsResponseDto,
} from "@/modules/brands/presentation/graphql/dtos/brand-list-response.dto";
import {
  CreateBrandInputDto,
  GetBrandByIdInputDto,
  GetBrandFilterOptionsInputDto,
  ListBrandsInputDto,
  UpdateBrandInputDto,
} from "@/modules/brands/presentation/graphql/dtos/brand-input.dtos";

@Resolver()
export class BrandsResolver {
  constructor(
    private readonly createBrandUseCase: CreateBrandUseCase,
    private readonly updateBrandUseCase: UpdateBrandUseCase,
    private readonly getBrandByIdUseCase: GetBrandByIdUseCase,
    private readonly listBrandsUseCase: ListBrandsUseCase,
  ) {}

  @Query(() => ListBrandsResponseDto, { name: "getStoreBrands" })
  async getStoreBrands(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: ListBrandsInputDto,
  ) {
    const result = await this.listBrandsUseCase.execute(user.idUsers, input);
    return buildPaginatedListResponse(
      {
        ...result,
        items: result.items.map((item) => BrandResponseDto.fromView(item)),
      },
      RESPONSE_MESSAGES.brands.listed,
    );
  }

  @Query(() => BrandFilterOptionsDto, { name: "getStoreBrandFilterOptions" })
  async getStoreBrandFilterOptions(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: GetBrandFilterOptionsInputDto,
  ) {
    const options = await this.listBrandsUseCase.filterOptions(
      user.idUsers,
      input.idStore,
    );
    return BrandFilterOptionsDto.fromView(options);
  }

  @Query(() => BrandResponseDto, { name: "getBrandById" })
  async getBrandById(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: GetBrandByIdInputDto,
  ) {
    const brand = await this.getBrandByIdUseCase.execute(
      user.idUsers,
      input.idStore,
      input.idBrand,
    );
    return BrandResponseDto.fromView(brand);
  }

  @Mutation(() => BrandMutationResponseDto, { name: "createBrand" })
  async createBrand(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: CreateBrandInputDto,
  ) {
    const created = await this.createBrandUseCase.execute(user.idUsers, {
      idStore: input.idStore,
      name: input.name,
      status: input.status,
    });
    return buildDataResponse(
      BrandResponseDto.fromView(created),
      RESPONSE_MESSAGES.brands.created,
    );
  }

  @Mutation(() => BrandMutationResponseDto, { name: "updateBrand" })
  async updateBrand(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: UpdateBrandInputDto,
  ) {
    const updated = await this.updateBrandUseCase.execute(user.idUsers, {
      idStore: input.idStore,
      idBrand: input.idBrand,
      name: input.name,
      status: input.status,
    });
    return buildDataResponse(
      BrandResponseDto.fromView(updated),
      RESPONSE_MESSAGES.brands.updated,
    );
  }
}
