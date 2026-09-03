import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { RESPONSE_MESSAGES } from "@/common/responses/catalogs/response-messages.catalog";
import {
  buildDataResponse,
  buildPaginatedListResponse,
} from "@/common/responses/helpers/response.helper";
import type { AuthenticatedUser } from "@/modules/auth/domain/interfaces/auth-token-payload.interface";
import { CreateProductUseCase } from "@/modules/catalog/application/use-cases/create-product.use-case";
import { UpdateProductUseCase } from "@/modules/catalog/application/use-cases/update-product.use-case";
import { GetProductByIdUseCase } from "@/modules/catalog/application/use-cases/get-product-by-id.use-case";
import { ListProductsUseCase } from "@/modules/catalog/application/use-cases/list-products.use-case";
import { ProductResponseDto } from "@/modules/catalog/presentation/graphql/dtos/product-response.dto";
import { ProductFilterOptionsDto } from "@/modules/catalog/presentation/graphql/dtos/product-filter-options.dto";
import {
  ListProductsResponseDto,
  ProductMutationResponseDto,
} from "@/modules/catalog/presentation/graphql/dtos/product-list-response.dto";
import {
  CreateProductInputDto,
  GetProductByIdInputDto,
  GetProductFilterOptionsInputDto,
  ListProductsInputDto,
  UpdateProductInputDto,
} from "@/modules/catalog/presentation/graphql/dtos/product-input.dtos";
import "@/modules/catalog/presentation/graphql/enums/catalog-graphql.enums";

@Resolver()
export class ProductsResolver {
  constructor(
    private readonly createProductUseCase: CreateProductUseCase,
    private readonly updateProductUseCase: UpdateProductUseCase,
    private readonly getProductByIdUseCase: GetProductByIdUseCase,
    private readonly listProductsUseCase: ListProductsUseCase,
  ) {}

  @Query(() => ListProductsResponseDto, { name: "getStoreProducts" })
  async getStoreProducts(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: ListProductsInputDto,
  ) {
    const result = await this.listProductsUseCase.execute(user.idUsers, input);
    return buildPaginatedListResponse(
      {
        ...result,
        items: result.items.map((item) => ProductResponseDto.fromView(item)),
      },
      RESPONSE_MESSAGES.catalog.listed,
    );
  }

  @Query(() => ProductFilterOptionsDto, {
    name: "getStoreProductFilterOptions",
  })
  async getStoreProductFilterOptions(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: GetProductFilterOptionsInputDto,
  ) {
    const options = await this.listProductsUseCase.filterOptions(
      user.idUsers,
      input.idStore,
    );
    return ProductFilterOptionsDto.fromView(options);
  }

  @Query(() => ProductResponseDto, { name: "getProductById" })
  async getProductById(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: GetProductByIdInputDto,
  ) {
    const product = await this.getProductByIdUseCase.execute(
      user.idUsers,
      input.idStore,
      input.idProduct,
    );
    return ProductResponseDto.fromView(product);
  }

  @Mutation(() => ProductMutationResponseDto, { name: "createProduct" })
  async createProduct(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: CreateProductInputDto,
  ) {
    const created = await this.createProductUseCase.execute(user.idUsers, {
      idStore: input.idStore,
      name: input.name,
      description: input.description,
      brand: input.brand,
      kind: input.kind,
      unit: input.unit,
      packagingUnit: input.packagingUnit,
      packSize: input.packSize,
      salePrice: input.salePrice,
    });
    return buildDataResponse(
      ProductResponseDto.fromView(created),
      RESPONSE_MESSAGES.catalog.created,
    );
  }

  @Mutation(() => ProductMutationResponseDto, { name: "updateProduct" })
  async updateProduct(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: UpdateProductInputDto,
  ) {
    const updated = await this.updateProductUseCase.execute(user.idUsers, {
      idStore: input.idStore,
      idProduct: input.idProduct,
      name: input.name,
      description: input.description,
      brand: input.brand,
      kind: input.kind,
      unit: input.unit,
      packagingUnit: input.packagingUnit,
      packSize: input.packSize,
      salePrice: input.salePrice,
      status: input.status,
    });
    return buildDataResponse(
      ProductResponseDto.fromView(updated),
      RESPONSE_MESSAGES.catalog.updated,
    );
  }
}
