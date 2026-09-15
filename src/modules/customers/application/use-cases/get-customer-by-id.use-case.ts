import { Inject, Injectable } from "@nestjs/common";
import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { StoreAuthorizationService } from "@/modules/stores/application/use-cases/store-authorization.use-case";
import { StorePermission } from "@/modules/stores/domain/enums/store-permission.enum";
import {
  CUSTOMER_REPOSITORY,
  type CustomerRepositoryPort,
  type CustomerView,
} from "@/modules/customers/application/ports/customer-repository.port";

@Injectable()
export class GetCustomerByIdUseCase {
  constructor(
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customerRepository: CustomerRepositoryPort,
    private readonly storeAuthorizationService: StoreAuthorizationService,
  ) {}

  async execute(
    userId: string,
    idStore: string,
    idCustomer: string,
  ): Promise<CustomerView> {
    await this.storeAuthorizationService.assertStorePermission(
      userId,
      idStore,
      StorePermission.VIEW_STORE,
    );

    const customer = await this.customerRepository.findById(
      idStore,
      idCustomer,
    );
    if (!customer) {
      throw AppException.from(APP_ERRORS.customers.notFound, undefined);
    }

    return customer;
  }
}
