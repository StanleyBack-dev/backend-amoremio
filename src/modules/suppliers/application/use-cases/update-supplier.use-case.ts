import { Inject, Injectable } from "@nestjs/common";
import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { StoreAuthorizationService } from "@/modules/stores/application/use-cases/store-authorization.use-case";
import { StorePermission } from "@/modules/stores/domain/enums/store-permission.enum";
import {
  SUPPLIER_REPOSITORY,
  type SupplierRepositoryPort,
  type SupplierView,
} from "@/modules/suppliers/application/ports/supplier-repository.port";
import { UpdateSupplierCommand } from "@/modules/suppliers/application/dto/supplier.commands";

function optionalText(
  value: string | null | undefined,
): string | null | undefined {
  if (value === undefined) return undefined;
  return (value ?? "").trim() || null;
}

@Injectable()
export class UpdateSupplierUseCase {
  constructor(
    @Inject(SUPPLIER_REPOSITORY)
    private readonly supplierRepository: SupplierRepositoryPort,
    private readonly storeAuthorizationService: StoreAuthorizationService,
  ) {}

  async execute(
    userId: string,
    command: UpdateSupplierCommand,
  ): Promise<SupplierView> {
    await this.storeAuthorizationService.assertStorePermission(
      userId,
      command.idStore,
      StorePermission.REGISTER_PURCHASE,
    );

    const existing = await this.supplierRepository.findById(
      command.idStore,
      command.idSupplier,
    );
    if (!existing) {
      throw AppException.from(APP_ERRORS.suppliers.notFound, undefined);
    }

    let name: string | undefined;
    if (command.name !== undefined) {
      name = command.name.trim();
      if (!name) {
        throw AppException.from(APP_ERRORS.validation.missingField, {
          field: "name",
        });
      }
      const clash = await this.supplierRepository.findByName(
        command.idStore,
        name,
      );
      if (clash && clash.idSupplier !== command.idSupplier) {
        throw AppException.from(APP_ERRORS.suppliers.duplicatedName, undefined);
      }
    }

    return this.supplierRepository.update({
      idSupplier: command.idSupplier,
      idStore: command.idStore,
      name,
      phone: optionalText(command.phone),
      email: optionalText(command.email),
      address: optionalText(command.address),
      instagram: optionalText(command.instagram),
      document: optionalText(command.document),
      notes: optionalText(command.notes),
      status: command.status,
    });
  }
}
