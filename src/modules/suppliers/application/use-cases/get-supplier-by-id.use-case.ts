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

@Injectable()
export class GetSupplierByIdUseCase {
  constructor(
    @Inject(SUPPLIER_REPOSITORY)
    private readonly supplierRepository: SupplierRepositoryPort,
    private readonly storeAuthorizationService: StoreAuthorizationService,
  ) {}

  async execute(
    userId: string,
    idStore: string,
    idSupplier: string,
  ): Promise<SupplierView> {
    await this.storeAuthorizationService.assertStorePermission(
      userId,
      idStore,
      StorePermission.VIEW_STORE,
    );

    const supplier = await this.supplierRepository.findById(
      idStore,
      idSupplier,
    );
    if (!supplier) {
      throw AppException.from(APP_ERRORS.suppliers.notFound, undefined);
    }

    return supplier;
  }
}
