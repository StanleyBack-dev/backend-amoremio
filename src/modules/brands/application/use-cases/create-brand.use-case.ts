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
import { CreateBrandCommand } from "@/modules/brands/application/dto/brand.commands";
import { Brand } from "@/modules/brands/domain/entities/brand.entity";

@Injectable()
export class CreateBrandUseCase {
  constructor(
    @Inject(BRAND_REPOSITORY)
    private readonly brandRepository: BrandRepositoryPort,
    private readonly storeAuthorizationService: StoreAuthorizationService,
  ) {}

  async execute(
    userId: string,
    command: CreateBrandCommand,
  ): Promise<BrandView> {
    await this.storeAuthorizationService.assertStorePermission(
      userId,
      command.idStore,
      StorePermission.MANAGE_PRODUCTS,
    );

    const brand = Brand.create({
      idStore: command.idStore,
      name: command.name,
      status: command.status,
      createdByUserId: userId,
    });
    const primitive = brand.toPrimitive();

    const duplicated = await this.brandRepository.findByName(
      primitive.idStore,
      primitive.name,
    );
    if (duplicated) {
      throw AppException.from(APP_ERRORS.brands.duplicatedName, undefined);
    }

    return this.brandRepository.create({
      idStore: primitive.idStore,
      name: primitive.name,
      status: primitive.status,
      createdByUserId: primitive.createdByUserId,
    });
  }
}
