import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { StoresModule } from "@/modules/stores/stores.module";
import { SUPPLIER_REPOSITORY } from "@/modules/suppliers/application/ports/supplier-repository.port";
import { CreateSupplierUseCase } from "@/modules/suppliers/application/use-cases/create-supplier.use-case";
import { UpdateSupplierUseCase } from "@/modules/suppliers/application/use-cases/update-supplier.use-case";
import { GetSupplierByIdUseCase } from "@/modules/suppliers/application/use-cases/get-supplier-by-id.use-case";
import { ListSuppliersUseCase } from "@/modules/suppliers/application/use-cases/list-suppliers.use-case";
import { SupplierEntity } from "@/modules/suppliers/infrastructure/persistence/typeorm/entities/supplier.entity";
import { SupplierTypeormRepository } from "@/modules/suppliers/infrastructure/persistence/typeorm/repositories/supplier-typeorm.repository";
import { SuppliersResolver } from "@/modules/suppliers/presentation/graphql/resolvers/suppliers.resolver";

@Module({
  imports: [TypeOrmModule.forFeature([SupplierEntity]), StoresModule],
  providers: [
    SupplierTypeormRepository,
    { provide: SUPPLIER_REPOSITORY, useExisting: SupplierTypeormRepository },
    CreateSupplierUseCase,
    UpdateSupplierUseCase,
    GetSupplierByIdUseCase,
    ListSuppliersUseCase,
    SuppliersResolver,
  ],
  exports: [SUPPLIER_REPOSITORY],
})
export class SuppliersModule {}
