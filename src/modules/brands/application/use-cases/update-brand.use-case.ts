import { Inject, Injectable } from "@nestjs/common";
import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import { StoreAuthorizationService } from "@/modules/stores/application/use-cases/store-authorization.use-case";
import { StorePermission } from "@/modules/stores/domain/enums/store-permission.enum";
import {
  BRAND_REPOSITORY,
  type BrandRepositoryPort,
  type BrandView,
} from "@/modules/brands/application/ports/brand-repository.port";
import { UpdateBrandCommand } from "@/modules/brands/application/dto/brand.commands";

@Injectable()
export class UpdateBrandUseCase {
  constructor(
    @Inject(BRAND_REPOSITORY)
    private readonly brandRepository: BrandRepositoryPort,
    private readonly storeAuthorizationService: StoreAuthorizationService,
  ) {}

  async execute(
    userId: string,
    command: UpdateBrandCommand,
  ): Promise<BrandView> {
    await this.storeAuthorizationService.assertStorePermission(
      userId,
      command.idStore,
      StorePermission.MANAGE_PRODUCTS,
    );

    const existing = await this.brandRepository.findById(
      command.idStore,
      command.idBrand,
    );
    if (!existing) {
      throw AppException.from(APP_ERRORS.brands.notFound, undefined);
    }

    let name: string | undefined;
    if (command.name !== undefined) {
      name = command.name.trim();
      if (!name) {
        throw AppException.from(APP_ERRORS.validation.missingField, {
          field: "name",
        });
      }
      const clash = await this.brandRepository.findByName(
        command.idStore,
        name,
      );
      if (clash && clash.idBrand !== command.idBrand) {
        throw AppException.from(APP_ERRORS.brands.duplicatedName, undefined);
      }
    }

    return this.brandRepository.update({
      idBrand: command.idBrand,
      idStore: command.idStore,
      name,
      status: command.status,
    });
  }
}
