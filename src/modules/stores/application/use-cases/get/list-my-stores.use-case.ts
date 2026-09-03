import { Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UserGroup } from "@/modules/users/domain/enums/user-group.enum";
import { UserEntity } from "@/modules/users/infrastructure/persistence/typeorm/entities/user.entity";
import {
  STORE_REPOSITORY,
  type StoreRepositoryPort,
  type StoreWithRoleView,
} from "@/modules/stores/application/ports/store-repository.port";
import { StoreRole } from "@/modules/stores/domain/enums/store-role.enum";

@Injectable()
export class ListMyStoresUseCase {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @Inject(STORE_REPOSITORY)
    private readonly storeRepository: StoreRepositoryPort,
  ) {}

  async execute(userId: string): Promise<StoreWithRoleView[]> {
    const user = await this.userRepository.findOne({
      where: { idUsers: userId },
    });

    // ADMIN_MASTER sees every store (reported as DONO so the client grants
    // full access), regardless of an explicit membership row.
    if (user?.group === UserGroup.ADMIN_MASTER) {
      const all = await this.storeRepository.listAll();
      return all.map((store) => ({ ...store, role: StoreRole.DONO }));
    }

    return this.storeRepository.listByMember(userId);
  }
}
