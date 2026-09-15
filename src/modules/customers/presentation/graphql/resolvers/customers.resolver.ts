import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { RESPONSE_MESSAGES } from "@/common/responses/catalogs/response-messages.catalog";
import {
  buildDataResponse,
  buildPaginatedListResponse,
} from "@/common/responses/helpers/response.helper";
import type { AuthenticatedUser } from "@/modules/auth/domain/interfaces/auth-token-payload.interface";
import { CreateCustomerUseCase } from "@/modules/customers/application/use-cases/create-customer.use-case";
import { UpdateCustomerUseCase } from "@/modules/customers/application/use-cases/update-customer.use-case";
import { GetCustomerByIdUseCase } from "@/modules/customers/application/use-cases/get-customer-by-id.use-case";
import { ListCustomersUseCase } from "@/modules/customers/application/use-cases/list-customers.use-case";
import { CustomerResponseDto } from "@/modules/customers/presentation/graphql/dtos/customer-response.dto";
import { CustomerFilterOptionsDto } from "@/modules/customers/presentation/graphql/dtos/customer-filter-options.dto";
import {
  CustomerMutationResponseDto,
  ListCustomersResponseDto,
} from "@/modules/customers/presentation/graphql/dtos/customer-list-response.dto";
import {
  CreateCustomerInputDto,
  GetCustomerByIdInputDto,
  GetCustomerFilterOptionsInputDto,
  ListCustomersInputDto,
  UpdateCustomerInputDto,
} from "@/modules/customers/presentation/graphql/dtos/customer-input.dtos";

@Resolver()
export class CustomersResolver {
  constructor(
    private readonly createCustomerUseCase: CreateCustomerUseCase,
    private readonly updateCustomerUseCase: UpdateCustomerUseCase,
    private readonly getCustomerByIdUseCase: GetCustomerByIdUseCase,
    private readonly listCustomersUseCase: ListCustomersUseCase,
  ) {}

  @Query(() => ListCustomersResponseDto, { name: "getStoreCustomers" })
  async getStoreCustomers(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: ListCustomersInputDto,
  ) {
    const result = await this.listCustomersUseCase.execute(user.idUsers, input);
    return buildPaginatedListResponse(
      {
        ...result,
        items: result.items.map((item) => CustomerResponseDto.fromView(item)),
      },
      RESPONSE_MESSAGES.customers.listed,
    );
  }

  @Query(() => CustomerFilterOptionsDto, {
    name: "getStoreCustomerFilterOptions",
  })
  async getStoreCustomerFilterOptions(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: GetCustomerFilterOptionsInputDto,
  ) {
    const options = await this.listCustomersUseCase.filterOptions(
      user.idUsers,
      input.idStore,
    );
    return CustomerFilterOptionsDto.fromView(options);
  }

  @Query(() => CustomerResponseDto, { name: "getCustomerById" })
  async getCustomerById(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: GetCustomerByIdInputDto,
  ) {
    const customer = await this.getCustomerByIdUseCase.execute(
      user.idUsers,
      input.idStore,
      input.idCustomer,
    );
    return CustomerResponseDto.fromView(customer);
  }

  @Mutation(() => CustomerMutationResponseDto, { name: "createCustomer" })
  async createCustomer(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: CreateCustomerInputDto,
  ) {
    const created = await this.createCustomerUseCase.execute(user.idUsers, {
      idStore: input.idStore,
      name: input.name,
      phone: input.phone,
      email: input.email,
      address: input.address,
      notes: input.notes,
      status: input.status,
    });
    return buildDataResponse(
      CustomerResponseDto.fromView(created),
      RESPONSE_MESSAGES.customers.created,
    );
  }

  @Mutation(() => CustomerMutationResponseDto, { name: "updateCustomer" })
  async updateCustomer(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: UpdateCustomerInputDto,
  ) {
    const updated = await this.updateCustomerUseCase.execute(user.idUsers, {
      idStore: input.idStore,
      idCustomer: input.idCustomer,
      name: input.name,
      phone: input.phone,
      email: input.email,
      address: input.address,
      notes: input.notes,
      status: input.status,
    });
    return buildDataResponse(
      CustomerResponseDto.fromView(updated),
      RESPONSE_MESSAGES.customers.updated,
    );
  }
}
