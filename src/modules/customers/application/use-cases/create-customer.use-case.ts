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
import { CreateCustomerCommand } from "@/modules/customers/application/dto/customer.commands";
import { Customer } from "@/modules/customers/domain/entities/customer.entity";

@Injectable()
export class CreateCustomerUseCase {
  constructor(
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customerRepository: CustomerRepositoryPort,
    private readonly storeAuthorizationService: StoreAuthorizationService,
  ) {}

  async execute(
    userId: string,
    command: CreateCustomerCommand,
  ): Promise<CustomerView> {
    await this.storeAuthorizationService.assertStorePermission(
      userId,
      command.idStore,
      StorePermission.REGISTER_SALE,
    );

    const customer = Customer.create({
      idStore: command.idStore,
      name: command.name,
      phone: command.phone,
      email: command.email,
      address: command.address,
      notes: command.notes,
      status: command.status,
      createdByUserId: userId,
    });
    const primitive = customer.toPrimitive();

    // Phone is the reliable dedupe key (see Customer.normalizePhone) — name
    // alone is too easy to type two different ways for the same person.
    if (primitive.phone) {
      const duplicated = await this.customerRepository.findByPhone(
        primitive.idStore,
        primitive.phone,
      );
      if (duplicated) {
        throw AppException.from(
          APP_ERRORS.customers.duplicatedPhone,
          undefined,
        );
      }
    }

    return this.customerRepository.create(primitive);
  }
}
