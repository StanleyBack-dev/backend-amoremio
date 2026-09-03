import { Inject, Injectable } from "@nestjs/common";
import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import {
  STORE_REPOSITORY,
  type StoreRepositoryPort,
  type StoreView,
} from "@/modules/stores/application/ports/store-repository.port";
import { UpdateStoreCommand } from "@/modules/stores/application/dto/update-store.command";
import { StoreAuthorizationService } from "@/modules/stores/application/use-cases/store-authorization.use-case";
import {
  assertValidStoreName,
  normalizeOptionalCnpj,
  storeContactNormalizers,
} from "@/modules/stores/domain/entities/store.entity";
import { StorePermission } from "@/modules/stores/domain/enums/store-permission.enum";

@Injectable()
export class UpdateStoreUseCase {
  constructor(
    @Inject(STORE_REPOSITORY)
    private readonly storeRepository: StoreRepositoryPort,
    private readonly storeAuthorizationService: StoreAuthorizationService,
  ) {}

  async execute(
    userId: string,
    command: UpdateStoreCommand,
  ): Promise<StoreView> {
    await this.storeAuthorizationService.assertStorePermission(
      userId,
      command.idStore,
      StorePermission.MANAGE_STORE,
    );

    const existing = await this.storeRepository.findById(command.idStore);
    if (!existing) {
      throw AppException.from(APP_ERRORS.stores.notFound, undefined);
    }

    const contact = (
      ["whatsapp", "email", "instagram", "ifoodUrl", "food99Url"] as const
    ).reduce<Record<string, string | null>>((acc, key) => {
      if (command[key] !== undefined) {
        acc[key] = storeContactNormalizers[key](command[key]);
      }
      return acc;
    }, {});

    return this.storeRepository.update({
      idStore: command.idStore,
      name:
        command.name !== undefined
          ? assertValidStoreName(command.name)
          : undefined,
      legalName:
        command.legalName !== undefined
          ? (command.legalName ?? "").trim() || null
          : undefined,
      cnpj:
        command.cnpj !== undefined
          ? normalizeOptionalCnpj(command.cnpj)
          : undefined,
      status: command.status,
      ...contact,
    });
  }
}
