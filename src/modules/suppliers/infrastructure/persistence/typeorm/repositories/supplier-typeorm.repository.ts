import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, ILike, In, Repository } from "typeorm";
import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import {
  type CreateSupplierPayload,
  type ListSuppliersFilters,
  type SupplierFilterOptions,
  type SupplierRepositoryPort,
  type SupplierView,
  type UpdateSupplierPayload,
} from "@/modules/suppliers/application/ports/supplier-repository.port";
import { SupplierEntity } from "@/modules/suppliers/infrastructure/persistence/typeorm/entities/supplier.entity";
import { UserEntity } from "@/modules/users/infrastructure/persistence/typeorm/entities/user.entity";

@Injectable()
export class SupplierTypeormRepository implements SupplierRepositoryPort {
  constructor(
    @InjectRepository(SupplierEntity)
    private readonly repository: Repository<SupplierEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async create(payload: CreateSupplierPayload): Promise<SupplierView> {
    const saved = await this.repository.save(
      this.repository.create({
        idStore: payload.idStore,
        name: payload.name,
        phone: payload.phone,
        email: payload.email,
        address: payload.address,
        instagram: payload.instagram,
        document: payload.document,
        notes: payload.notes,
        status: payload.status,
        createdByUserId: payload.createdByUserId,
      }),
    );
    return this.mapToView(
      saved,
      await this.resolveCreatorName(saved.createdByUserId),
    );
  }

  async update(payload: UpdateSupplierPayload): Promise<SupplierView> {
    const supplier = await this.repository.findOne({
      where: { idSupplier: payload.idSupplier, idStore: payload.idStore },
    });
    if (!supplier) {
      throw AppException.from(APP_ERRORS.suppliers.notFound, undefined);
    }

    if (payload.name !== undefined) supplier.name = payload.name;
    if (payload.phone !== undefined) supplier.phone = payload.phone;
    if (payload.email !== undefined) supplier.email = payload.email;
    if (payload.address !== undefined) supplier.address = payload.address;
    if (payload.instagram !== undefined) supplier.instagram = payload.instagram;
    if (payload.document !== undefined) supplier.document = payload.document;
    if (payload.notes !== undefined) supplier.notes = payload.notes;
    if (payload.status !== undefined) supplier.status = payload.status;

    const saved = await this.repository.save(supplier);
    return this.mapToView(
      saved,
      await this.resolveCreatorName(saved.createdByUserId),
    );
  }

  async findById(
    idStore: string,
    idSupplier: string,
  ): Promise<SupplierView | null> {
    const supplier = await this.repository.findOne({
      where: { idSupplier, idStore },
    });
    if (!supplier) return null;
    return this.mapToView(
      supplier,
      await this.resolveCreatorName(supplier.createdByUserId),
    );
  }

  async findByName(
    idStore: string,
    name: string,
  ): Promise<SupplierView | null> {
    const supplier = await this.repository.findOne({
      where: { idStore, name: ILike(name.trim()) },
    });
    return supplier ? this.mapToView(supplier) : null;
  }

  async listByStore(
    idStore: string,
    filters?: ListSuppliersFilters,
  ): Promise<{ records: SupplierView[]; total: number }> {
    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 20;

    const query = this.repository
      .createQueryBuilder("supplier")
      .where("supplier.idStore = :idStore", { idStore });

    if (filters?.status !== undefined) {
      query.andWhere("supplier.status = :status", { status: filters.status });
    }

    if (filters?.name) {
      query.andWhere("supplier.name = :name", { name: filters.name.trim() });
    }

    if (filters?.createdByUserId) {
      query.andWhere("supplier.createdByUserId = :createdByUserId", {
        createdByUserId: filters.createdByUserId,
      });
    }

    if (filters?.search) {
      query.andWhere(
        "(supplier.name ILIKE :search OR supplier.email ILIKE :search OR supplier.phone ILIKE :search)",
        { search: `%${filters.search.trim()}%` },
      );
    }

    const [rows, total] = await query
      .orderBy("supplier.name", "ASC")
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

  async listFilterOptions(idStore: string): Promise<SupplierFilterOptions> {
    const rows = await this.repository
      .createQueryBuilder("supplier")
      .select("supplier.name", "name")
      .addSelect("supplier.createdByUserId", "createdByUserId")
      .where("supplier.idStore = :idStore", { idStore })
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
    entity: SupplierEntity,
    creatorName: string | null = null,
  ): SupplierView {
    return {
      idSupplier: entity.idSupplier,
      idStore: entity.idStore,
      name: entity.name,
      phone: entity.phone ?? null,
      email: entity.email ?? null,
      address: entity.address ?? null,
      instagram: entity.instagram ?? null,
      document: entity.document ?? null,
      notes: entity.notes ?? null,
      status: entity.status,
      createdByUserId: entity.createdByUserId,
      createdByUserName: creatorName,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
