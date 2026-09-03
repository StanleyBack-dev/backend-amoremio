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
import { CreateSupplierCommand } from "@/modules/suppliers/application/dto/supplier.commands";
import { Supplier } from "@/modules/suppliers/domain/entities/supplier.entity";

@Injectable()
export class CreateSupplierUseCase {
  constructor(
    @Inject(SUPPLIER_REPOSITORY)
    private readonly supplierRepository: SupplierRepositoryPort,
    private readonly storeAuthorizationService: StoreAuthorizationService,
  ) {}

  async execute(
    userId: string,
    command: CreateSupplierCommand,
  ): Promise<SupplierView> {
    await this.storeAuthorizationService.assertStorePermission(
      userId,
      command.idStore,
      StorePermission.REGISTER_PURCHASE,
    );

    const supplier = Supplier.create({
      idStore: command.idStore,
      name: command.name,
      phone: command.phone,
      email: command.email,
      address: command.address,
      instagram: command.instagram,
      document: command.document,
      notes: command.notes,
      status: command.status,
      createdByUserId: userId,
    });
    const primitive = supplier.toPrimitive();

    const duplicated = await this.supplierRepository.findByName(
      primitive.idStore,
      primitive.name,
    );
    if (duplicated) {
      throw AppException.from(APP_ERRORS.suppliers.duplicatedName, undefined);
    }

    return this.supplierRepository.create(primitive);
  }
}
