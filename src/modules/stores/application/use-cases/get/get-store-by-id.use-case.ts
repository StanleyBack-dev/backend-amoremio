import { Inject, Injectable } from "@nestjs/common";
import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import {
  STORE_REPOSITORY,
  type StoreRepositoryPort,
  type StoreView,
} from "@/modules/stores/application/ports/store-repository.port";
import { StoreAuthorizationService } from "@/modules/stores/application/use-cases/store-authorization.use-case";
import { StorePermission } from "@/modules/stores/domain/enums/store-permission.enum";

@Injectable()
export class GetStoreByIdUseCase {
  constructor(
    @Inject(STORE_REPOSITORY)
    private readonly storeRepository: StoreRepositoryPort,
    private readonly storeAuthorizationService: StoreAuthorizationService,
  ) {}

  async execute(userId: string, idStore: string): Promise<StoreView> {
    await this.storeAuthorizationService.assertStorePermission(
      userId,
      idStore,
      StorePermission.VIEW_STORE,
    );

    const store = await this.storeRepository.findById(idStore);
    if (!store) {
      throw AppException.from(APP_ERRORS.stores.notFound, undefined);
    }

    return store;
  }
}
