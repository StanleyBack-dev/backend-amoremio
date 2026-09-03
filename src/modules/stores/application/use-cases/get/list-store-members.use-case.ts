import { Inject, Injectable } from "@nestjs/common";
import {
  STORE_REPOSITORY,
  type StoreMemberView,
  type StoreRepositoryPort,
} from "@/modules/stores/application/ports/store-repository.port";
import { StoreAuthorizationService } from "@/modules/stores/application/use-cases/store-authorization.use-case";
import { StorePermission } from "@/modules/stores/domain/enums/store-permission.enum";

@Injectable()
export class ListStoreMembersUseCase {
  constructor(
    @Inject(STORE_REPOSITORY)
    private readonly storeRepository: StoreRepositoryPort,
    private readonly storeAuthorizationService: StoreAuthorizationService,
  ) {}

  async execute(userId: string, idStore: string): Promise<StoreMemberView[]> {
    await this.storeAuthorizationService.assertStorePermission(
      userId,
      idStore,
      StorePermission.VIEW_STORE,
    );

    return this.storeRepository.listMembers(idStore);
  }
}
