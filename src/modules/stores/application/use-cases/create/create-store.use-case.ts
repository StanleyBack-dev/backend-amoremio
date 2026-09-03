import { Inject, Injectable } from "@nestjs/common";
import {
  STORE_REPOSITORY,
  type StoreRepositoryPort,
  type StoreWithRoleView,
} from "@/modules/stores/application/ports/store-repository.port";
import { CreateStoreCommand } from "@/modules/stores/application/dto/create-store.command";
import { Store } from "@/modules/stores/domain/entities/store.entity";
import { StoreRole } from "@/modules/stores/domain/enums/store-role.enum";

@Injectable()
export class CreateStoreUseCase {
  constructor(
    @Inject(STORE_REPOSITORY)
    private readonly storeRepository: StoreRepositoryPort,
  ) {}

  // Any authenticated user can create a store; they become its DONO. No
  // platform-level permission gate — owning a store is self-service.
  async execute(
    userId: string,
    command: CreateStoreCommand,
  ): Promise<StoreWithRoleView> {
    const store = Store.create({
      name: command.name,
      legalName: command.legalName,
      cnpj: command.cnpj,
      whatsapp: command.whatsapp,
      email: command.email,
      instagram: command.instagram,
      ifoodUrl: command.ifoodUrl,
      food99Url: command.food99Url,
      createdByUserId: userId,
    });

    const primitive = store.toPrimitive();
    const created = await this.storeRepository.create({
      name: primitive.name,
      legalName: primitive.legalName,
      cnpj: primitive.cnpj,
      whatsapp: primitive.whatsapp,
      email: primitive.email,
      instagram: primitive.instagram,
      ifoodUrl: primitive.ifoodUrl,
      food99Url: primitive.food99Url,
      createdByUserId: primitive.createdByUserId,
      ownerUserId: userId,
    });

    return { ...created, role: StoreRole.DONO };
  }
}
