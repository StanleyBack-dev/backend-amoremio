import { Inject, Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UserGroup } from "@/modules/users/domain/enums/user-group.enum";
import { UserEntity } from "@/modules/users/infrastructure/persistence/typeorm/entities/user.entity";
import {
  STORE_REPOSITORY,
  type StoreRepositoryPort,
} from "@/modules/stores/application/ports/store-repository.port";

// Seeds the first store on a fresh install: if bootstrap is enabled and an
// ADMIN_MASTER exists but there is no store yet, create a default one owned
// by that ADMIN_MASTER so the app is usable end to end without a manual
// createStore call.
@Injectable()
export class StoreBootstrapService implements OnApplicationBootstrap {
  private readonly logger = new Logger(StoreBootstrapService.name);

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @Inject(STORE_REPOSITORY)
    private readonly storeRepository: StoreRepositoryPort,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const enabled =
      this.configService.get<boolean>("BOOTSTRAP_ADMIN_MASTER_ENABLED") ===
      true;
    if (!enabled) {
      return;
    }

    if ((await this.storeRepository.countAll()) > 0) {
      return;
    }

    const adminMaster = await this.userRepository.findOne({
      where: { group: UserGroup.ADMIN_MASTER },
    });
    if (!adminMaster) {
      return;
    }

    const name =
      this.configService.get<string>("BOOTSTRAP_STORE_NAME")?.trim() ||
      "Amore Mio";

    await this.storeRepository.create({
      name,
      legalName: null,
      cnpj: null,
      createdByUserId: adminMaster.idUsers,
      ownerUserId: adminMaster.idUsers,
    });

    this.logger.warn(
      `Default store "${name}" created and assigned to the ADMIN_MASTER (${adminMaster.email}).`,
    );
  }
}
