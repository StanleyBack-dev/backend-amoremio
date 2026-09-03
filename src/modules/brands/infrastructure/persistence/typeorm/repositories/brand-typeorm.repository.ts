import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, ILike, In, Repository } from "typeorm";
import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import {
  type BrandFilterOptions,
  type CreateBrandPayload,
  type ListBrandsFilters,
  type BrandRepositoryPort,
  type BrandView,
  type UpdateBrandPayload,
} from "@/modules/brands/application/ports/brand-repository.port";
import { BrandEntity } from "@/modules/brands/infrastructure/persistence/typeorm/entities/brand.entity";
import { UserEntity } from "@/modules/users/infrastructure/persistence/typeorm/entities/user.entity";

@Injectable()
export class BrandTypeormRepository implements BrandRepositoryPort {
  constructor(
    @InjectRepository(BrandEntity)
    private readonly repository: Repository<BrandEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async create(payload: CreateBrandPayload): Promise<BrandView> {
    const saved = await this.repository.save(
      this.repository.create({
        idStore: payload.idStore,
        name: payload.name,
        status: payload.status,
        createdByUserId: payload.createdByUserId,
      }),
    );
    return this.mapToView(
      saved,
      await this.resolveCreatorName(saved.createdByUserId),
    );
  }

  async update(payload: UpdateBrandPayload): Promise<BrandView> {
    const brand = await this.repository.findOne({
      where: { idBrand: payload.idBrand, idStore: payload.idStore },
    });
    if (!brand) {
      throw AppException.from(APP_ERRORS.brands.notFound, undefined);
    }

    if (payload.name !== undefined) brand.name = payload.name;
    if (payload.status !== undefined) brand.status = payload.status;

    const saved = await this.repository.save(brand);
    return this.mapToView(
      saved,
      await this.resolveCreatorName(saved.createdByUserId),
    );
  }

  async findById(idStore: string, idBrand: string): Promise<BrandView | null> {
    const brand = await this.repository.findOne({
      where: { idBrand, idStore },
    });
    if (!brand) return null;
    return this.mapToView(
      brand,
      await this.resolveCreatorName(brand.createdByUserId),
    );
  }

  async findByName(idStore: string, name: string): Promise<BrandView | null> {
    const brand = await this.repository.findOne({
      where: { idStore, name: ILike(name.trim()) },
    });
    return brand ? this.mapToView(brand) : null;
  }

  async listByStore(
    idStore: string,
    filters?: ListBrandsFilters,
  ): Promise<{ records: BrandView[]; total: number }> {
    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 20;

    const query = this.repository
      .createQueryBuilder("brand")
      .where("brand.idStore = :idStore", { idStore });

    if (filters?.status !== undefined) {
      query.andWhere("brand.status = :status", { status: filters.status });
    }

    if (filters?.name) {
      query.andWhere("brand.name = :name", { name: filters.name.trim() });
    }

    if (filters?.createdByUserId) {
      query.andWhere("brand.createdByUserId = :createdByUserId", {
        createdByUserId: filters.createdByUserId,
      });
    }

    if (filters?.search) {
      query.andWhere("brand.name ILIKE :search", {
        search: `%${filters.search.trim()}%`,
      });
    }

    const [rows, total] = await query
      .orderBy("brand.name", "ASC")
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const creatorNames = await this.resolveCreatorNames(
      rows.map((row) => row.createdByUserId),
    );

    return {
      records: rows.map((row) =>
        this.mapToView(row, creatorNames.get(row.createdByUserId) ?? null),
      ),
      total,
    };
  }

  async listFilterOptions(idStore: string): Promise<BrandFilterOptions> {
    const rows = await this.repository
      .createQueryBuilder("brand")
      .select("brand.name", "name")
      .addSelect("brand.createdByUserId", "createdByUserId")
      .where("brand.idStore = :idStore", { idStore })
      .getRawMany<{ name: string; createdByUserId: string }>();

    const names = Array.from(
      new Set(rows.map((row) => row.name).filter(Boolean)),
    ).sort((a, b) => a.localeCompare(b, "pt-BR"));

    const creatorIds = Array.from(
      new Set(rows.map((row) => row.createdByUserId).filter(Boolean)),
    );
    const creatorNames = await this.resolveCreatorNames(creatorIds);
    const creators = creatorIds
      .map((id) => ({ id, name: creatorNames.get(id) ?? "—" }))
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

    return { names, creators };
  }

  // Resolves user ids to display names in a single batched query. Ids with no
  // matching user (e.g. removed accounts) are simply absent from the map.
  private async resolveCreatorNames(
    ids: Array<string | null | undefined>,
  ): Promise<Map<string, string>> {
    const uniqueIds = Array.from(
      new Set(ids.filter((id): id is string => !!id)),
    );
    if (uniqueIds.length === 0) return new Map();

    const users = await this.dataSource
      .getRepository(UserEntity)
      .find({ where: { idUsers: In(uniqueIds) }, select: ["idUsers", "name"] });

    return new Map(users.map((user) => [user.idUsers, user.name]));
  }

  private async resolveCreatorName(id: string): Promise<string | null> {
    return (await this.resolveCreatorNames([id])).get(id) ?? null;
  }

  private mapToView(
    entity: BrandEntity,
    creatorName: string | null = null,
  ): BrandView {
    return {
      idBrand: entity.idBrand,
      idStore: entity.idStore,
      name: entity.name,
      status: entity.status,
      createdByUserId: entity.createdByUserId,
      createdByUserName: creatorName,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
