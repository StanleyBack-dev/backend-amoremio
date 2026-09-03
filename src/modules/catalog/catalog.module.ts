import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { StoresModule } from "@/modules/stores/stores.module";
import { PRODUCT_REPOSITORY } from "@/modules/catalog/application/ports/product-repository.port";
import { CreateProductUseCase } from "@/modules/catalog/application/use-cases/create-product.use-case";
import { UpdateProductUseCase } from "@/modules/catalog/application/use-cases/update-product.use-case";
import { GetProductByIdUseCase } from "@/modules/catalog/application/use-cases/get-product-by-id.use-case";
import { ListProductsUseCase } from "@/modules/catalog/application/use-cases/list-products.use-case";
import { ProductEntity } from "@/modules/catalog/infrastructure/persistence/typeorm/entities/product.entity";
import { ProductTypeormRepository } from "@/modules/catalog/infrastructure/persistence/typeorm/repositories/product-typeorm.repository";
import { ProductsResolver } from "@/modules/catalog/presentation/graphql/resolvers/products.resolver";
import "@/modules/catalog/presentation/graphql/enums/catalog-graphql.enums";

@Module({
  imports: [TypeOrmModule.forFeature([ProductEntity]), StoresModule],
  providers: [
    ProductTypeormRepository,
    { provide: PRODUCT_REPOSITORY, useExisting: ProductTypeormRepository },
    CreateProductUseCase,
    UpdateProductUseCase,
    GetProductByIdUseCase,
    ListProductsUseCase,
    ProductsResolver,
  ],
  exports: [PRODUCT_REPOSITORY],
})
export class CatalogModule {}
