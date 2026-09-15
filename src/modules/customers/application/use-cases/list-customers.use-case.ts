import { Inject, Injectable } from "@nestjs/common";
import { StoreAuthorizationService } from "@/modules/stores/application/use-cases/store-authorization.use-case";
import { StorePermission } from "@/modules/stores/domain/enums/store-permission.enum";
import {
  CUSTOMER_REPOSITORY,
  type CustomerFilterOptions,
  type CustomerRepositoryPort,
  type CustomerView,
} from "@/modules/customers/application/ports/customer-repository.port";
import { ListCustomersQuery } from "@/modules/customers/application/dto/customer.commands";

export interface PaginatedCustomers {
  items: CustomerView[];
  total: number;
  currentPage: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
}

@Injectable()
export class ListCustomersUseCase {
  constructor(
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customerRepository: CustomerRepositoryPort,
    private readonly storeAuthorizationService: StoreAuthorizationService,
  ) {}

  async execute(
    userId: string,
    query: ListCustomersQuery,
  ): Promise<PaginatedCustomers> {
    await this.storeAuthorizationService.assertStorePermission(
      userId,
      query.idStore,
      StorePermission.VIEW_STORE,
    );

    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 20;

    const { records, total } = await this.customerRepository.listByStore(
      query.idStore,
      {
        page,
        limit,
        search: query.search,
        status: query.status,
        name: query.name,
        createdByUserId: query.createdByUserId,
      },
    );

    const totalPages = Math.max(Math.ceil(total / limit), 1);

    return {
      items: records,
      total,
      currentPage: page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
    };
  }

  async filterOptions(
    userId: string,
    idStore: string,
  ): Promise<CustomerFilterOptions> {
    await this.storeAuthorizationService.assertStorePermission(
      userId,
      idStore,
      StorePermission.VIEW_STORE,
    );

    return this.customerRepository.listFilterOptions(idStore);
  }
}
