import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, In, Repository } from "typeorm";
import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import {
  type CreateCustomerPayload,
  type CustomerFilterOptions,
  type CustomerRepositoryPort,
  type CustomerView,
  type ListCustomersFilters,
  type UpdateCustomerPayload,
} from "@/modules/customers/application/ports/customer-repository.port";
import { CustomerEntity } from "@/modules/customers/infrastructure/persistence/typeorm/entities/customer.entity";
import { UserEntity } from "@/modules/users/infrastructure/persistence/typeorm/entities/user.entity";

@Injectable()
export class CustomerTypeormRepository implements CustomerRepositoryPort {
  constructor(
    @InjectRepository(CustomerEntity)
    private readonly repository: Repository<CustomerEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async create(payload: CreateCustomerPayload): Promise<CustomerView> {
    const saved = await this.repository.save(
      this.repository.create({
        idStore: payload.idStore,
        name: payload.name,
        phone: payload.phone,
        email: payload.email,
        address: payload.address,
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

  async update(payload: UpdateCustomerPayload): Promise<CustomerView> {
    const customer = await this.repository.findOne({
      where: { idCustomer: payload.idCustomer, idStore: payload.idStore },
    });
    if (!customer) {
      throw AppException.from(APP_ERRORS.customers.notFound, undefined);
    }

    if (payload.name !== undefined) customer.name = payload.name;
    if (payload.phone !== undefined) customer.phone = payload.phone;
    if (payload.email !== undefined) customer.email = payload.email;
    if (payload.address !== undefined) customer.address = payload.address;
    if (payload.notes !== undefined) customer.notes = payload.notes;
    if (payload.status !== undefined) customer.status = payload.status;

    const saved = await this.repository.save(customer);
    return this.mapToView(
      saved,
      await this.resolveCreatorName(saved.createdByUserId),
    );
  }

  async findById(
    idStore: string,
    idCustomer: string,
  ): Promise<CustomerView | null> {
    const customer = await this.repository.findOne({
      where: { idCustomer, idStore },
    });
    if (!customer) return null;
    return this.mapToView(
      customer,
      await this.resolveCreatorName(customer.createdByUserId),
    );
  }

  async findByPhone(
    idStore: string,
    phone: string,
  ): Promise<CustomerView | null> {
    const customer = await this.repository.findOne({
      where: { idStore, phone },
    });
    return customer ? this.mapToView(customer) : null;
  }

  async listByStore(
    idStore: string,
    filters?: ListCustomersFilters,
  ): Promise<{ records: CustomerView[]; total: number }> {
    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 20;

    const query = this.repository
      .createQueryBuilder("customer")
      .where("customer.idStore = :idStore", { idStore });

    if (filters?.status !== undefined) {
      query.andWhere("customer.status = :status", { status: filters.status });
    }

    if (filters?.name) {
      query.andWhere("customer.name = :name", { name: filters.name.trim() });
    }

    if (filters?.createdByUserId) {
      query.andWhere("customer.createdByUserId = :createdByUserId", {
        createdByUserId: filters.createdByUserId,
      });
    }

    if (filters?.search) {
      query.andWhere(
        "(customer.name ILIKE :search OR customer.email ILIKE :search OR customer.phone ILIKE :search)",
        { search: `%${filters.search.trim()}%` },
      );
    }

    const [rows, total] = await query
      .orderBy("customer.name", "ASC")
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

  async listFilterOptions(idStore: string): Promise<CustomerFilterOptions> {
    const rows = await this.repository
      .createQueryBuilder("customer")
      .select("customer.name", "name")
      .addSelect("customer.createdByUserId", "createdByUserId")
      .where("customer.idStore = :idStore", { idStore })
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
    entity: CustomerEntity,
    creatorName: string | null = null,
  ): CustomerView {
    return {
      idCustomer: entity.idCustomer,
      idStore: entity.idStore,
      name: entity.name,
      phone: entity.phone ?? null,
      email: entity.email ?? null,
      address: entity.address ?? null,
      notes: entity.notes ?? null,
      status: entity.status,
      createdByUserId: entity.createdByUserId,
      createdByUserName: creatorName,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
