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
import { UpdateCustomerCommand } from "@/modules/customers/application/dto/customer.commands";
import { normalizePhone } from "@/modules/customers/domain/entities/customer.entity";

function optionalText(
  value: string | null | undefined,
): string | null | undefined {
  if (value === undefined) return undefined;
  return (value ?? "").trim() || null;
}

function optionalEmail(
  value: string | null | undefined,
): string | null | undefined {
  const normalized = optionalText(value);
  return normalized === undefined
    ? undefined
    : (normalized?.toLowerCase() ?? null);
}

@Injectable()
export class UpdateCustomerUseCase {
  constructor(
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customerRepository: CustomerRepositoryPort,
    private readonly storeAuthorizationService: StoreAuthorizationService,
  ) {}

  async execute(
    userId: string,
    command: UpdateCustomerCommand,
  ): Promise<CustomerView> {
    await this.storeAuthorizationService.assertStorePermission(
      userId,
      command.idStore,
      StorePermission.REGISTER_SALE,
    );

    const existing = await this.customerRepository.findById(
      command.idStore,
      command.idCustomer,
    );
    if (!existing) {
      throw AppException.from(APP_ERRORS.customers.notFound, undefined);
    }

    let name: string | undefined;
    if (command.name !== undefined) {
      name = command.name.trim();
      if (!name) {
        throw AppException.from(APP_ERRORS.validation.missingField, {
          field: "name",
        });
      }
    }

    let phone: string | null | undefined;
    if (command.phone !== undefined) {
      phone = normalizePhone(command.phone);
      if (phone) {
        const clash = await this.customerRepository.findByPhone(
          command.idStore,
          phone,
        );
        if (clash && clash.idCustomer !== command.idCustomer) {
          throw AppException.from(
            APP_ERRORS.customers.duplicatedPhone,
            undefined,
          );
        }
      }
    }

    return this.customerRepository.update({
      idCustomer: command.idCustomer,
      idStore: command.idStore,
      name,
      phone,
      email: optionalEmail(command.email),
      address: optionalText(command.address),
      notes: optionalText(command.notes),
      status: command.status,
    });
  }
}
