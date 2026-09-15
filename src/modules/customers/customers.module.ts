import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { StoresModule } from "@/modules/stores/stores.module";
import { CUSTOMER_REPOSITORY } from "@/modules/customers/application/ports/customer-repository.port";
import { CreateCustomerUseCase } from "@/modules/customers/application/use-cases/create-customer.use-case";
import { UpdateCustomerUseCase } from "@/modules/customers/application/use-cases/update-customer.use-case";
import { GetCustomerByIdUseCase } from "@/modules/customers/application/use-cases/get-customer-by-id.use-case";
import { ListCustomersUseCase } from "@/modules/customers/application/use-cases/list-customers.use-case";
import { CustomerEntity } from "@/modules/customers/infrastructure/persistence/typeorm/entities/customer.entity";
import { CustomerTypeormRepository } from "@/modules/customers/infrastructure/persistence/typeorm/repositories/customer-typeorm.repository";
import { CustomersResolver } from "@/modules/customers/presentation/graphql/resolvers/customers.resolver";

@Module({
  imports: [TypeOrmModule.forFeature([CustomerEntity]), StoresModule],
  providers: [
    CustomerTypeormRepository,
    { provide: CUSTOMER_REPOSITORY, useExisting: CustomerTypeormRepository },
    CreateCustomerUseCase,
    UpdateCustomerUseCase,
    GetCustomerByIdUseCase,
    ListCustomersUseCase,
    CustomersResolver,
  ],
  exports: [CUSTOMER_REPOSITORY],
})
export class CustomersModule {}
