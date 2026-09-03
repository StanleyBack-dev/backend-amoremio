import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { StoresModule } from "@/modules/stores/stores.module";
import { BRAND_REPOSITORY } from "@/modules/brands/application/ports/brand-repository.port";
import { CreateBrandUseCase } from "@/modules/brands/application/use-cases/create-brand.use-case";
import { UpdateBrandUseCase } from "@/modules/brands/application/use-cases/update-brand.use-case";
import { GetBrandByIdUseCase } from "@/modules/brands/application/use-cases/get-brand-by-id.use-case";
import { ListBrandsUseCase } from "@/modules/brands/application/use-cases/list-brands.use-case";
import { BrandEntity } from "@/modules/brands/infrastructure/persistence/typeorm/entities/brand.entity";
import { BrandTypeormRepository } from "@/modules/brands/infrastructure/persistence/typeorm/repositories/brand-typeorm.repository";
import { BrandsResolver } from "@/modules/brands/presentation/graphql/resolvers/brands.resolver";

@Module({
  imports: [TypeOrmModule.forFeature([BrandEntity]), StoresModule],
  providers: [
    BrandTypeormRepository,
    { provide: BRAND_REPOSITORY, useExisting: BrandTypeormRepository },
    CreateBrandUseCase,
    UpdateBrandUseCase,
    GetBrandByIdUseCase,
    ListBrandsUseCase,
    BrandsResolver,
  ],
  exports: [BRAND_REPOSITORY],
})
export class BrandsModule {}
