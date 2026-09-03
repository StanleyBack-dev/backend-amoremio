import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import {
  DataSource,
  ILike,
  In,
  Repository,
  type FindOptionsWhere,
} from "typeorm";
import { AppException } from "@/common/exceptions/app-exception";
import { APP_ERRORS } from "@/common/exceptions/app-errors.catalog";
import {
  type CreateProductPayload,
  type ListProductsFilters,
  type ProductFilterOptions,
  type ProductRepositoryPort,
  type ProductView,
  type UpdateProductPayload,
} from "@/modules/catalog/application/ports/product-repository.port";
import { ProductEntity } from "@/modules/catalog/infrastructure/persistence/typeorm/entities/product.entity";
import { UserEntity } from "@/modules/users/infrastructure/persistence/typeorm/entities/user.entity";

@Injectable()
export class ProductTypeormRepository implements ProductRepositoryPort {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly repository: Repository<ProductEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async create(payload: CreateProductPayload): Promise<ProductView> {
    const saved = await this.repository.save(
      this.repository.create({
        idStore: payload.idStore,
        name: payload.name,
        sku: payload.sku,
        description: payload.description,
        brand: payload.brand,
        kind: payload.kind,
        unit: payload.unit,
        packagingUnit: payload.packagingUnit,
        packSize: payload.packSize.toFixed(3),
        salePrice: payload.salePrice?.toFixed(2) ?? null,
        status: true,
        createdByUserId: payload.createdByUserId,
      }),
    );
    return this.mapToView(saved);
  }

  async update(payload: UpdateProductPayload): Promise<ProductView> {
    const product = await this.repository.findOne({
      where: { idProduct: payload.idProduct, idStore: payload.idStore },
    });
    if (!product) {
      throw AppException.from(APP_ERRORS.catalog.productNotFound, undefined);
    }

    if (payload.name !== undefined) product.name = payload.name;
    if (payload.description !== undefined)
      product.description = payload.description;
    if (payload.brand !== undefined) product.brand = payload.brand;
    if (payload.kind !== undefined) product.kind = payload.kind;
    if (payload.unit !== undefined) product.unit = payload.unit;
    if (payload.packagingUnit !== undefined)
      product.packagingUnit = payload.packagingUnit;
    if (payload.packSize !== undefined)
      product.packSize = payload.packSize.toFixed(3);
    if (payload.salePrice !== undefined)
      product.salePrice = payload.salePrice?.toFixed(2) ?? null;
    if (payload.status !== undefined) product.status = payload.status;

    const saved = await this.repository.save(product);
    return this.mapToView(
      saved,
      await this.resolveCreatorName(saved.createdByUserId),
    );
  }

  async findById(
    idStore: string,
    idProduct: string,
  ): Promise<ProductView | null> {
    const product = await this.repository.findOne({
      where: { idProduct, idStore },
    });
    if (!product) return null;
    return this.mapToView(
      product,
      await this.resolveCreatorName(product.createdByUserId),
    );
  }

  async findManyByIds(
    idStore: string,
    idProducts: string[],
  ): Promise<ProductView[]> {
    if (idProducts.length === 0) return [];
    const products = await this.repository.find({
      where: { idStore, idProduct: In(idProducts) },
    });
    return products.map((product) => this.mapToView(product));
  }

  async findByName(
    idStore: string,
    name: string,
    brand?: string | null,
  ): Promise<ProductView | null> {
    const where: FindOptionsWhere<ProductEntity> = {
      idStore,
      name: ILike(name.trim()),
    };
    const normalizedBrand = brand?.trim();
    if (normalizedBrand) {
      where.brand = ILike(normalizedBrand);
    }
    const product = await this.repository.findOne({ where });
    return product ? this.mapToView(product) : null;
  }

  async findBySku(idStore: string, sku: string): Promise<ProductView | null> {
    const product = await this.repository.findOne({
      where: { idStore, sku: sku.trim().toUpperCase() },
    });
    return product ? this.mapToView(product) : null;
  }

  async countBySkuBase(idStore: string, base: string): Promise<number> {
    return this.repository
      .createQueryBuilder("product")
      .where("product.idStore = :idStore", { idStore })
      .andWhere("product.sku LIKE :prefix", { prefix: `${base}-%` })
      .getCount();
  }

  async listByStore(
    idStore: string,
    filters?: ListProductsFilters,
  ): Promise<{ records: ProductView[]; total: number }> {
    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 20;

    const query = this.repository
      .createQueryBuilder("product")
      .where("product.idStore = :idStore", { idStore });

    if (filters?.status !== undefined) {
      query.andWhere("product.status = :status", { status: filters.status });
    }

    if (filters?.kinds && filters.kinds.length > 0) {
      query.andWhere("product.kind IN (:...kinds)", { kinds: filters.kinds });
    }

    if (filters?.name) {
      query.andWhere("product.name = :name", { name: filters.name.trim() });
    }

    if (filters?.withoutBrand) {
      query.andWhere("(product.brand IS NULL OR product.brand = '')");
    } else if (filters?.brand) {
      query.andWhere("product.brand = :brand", { brand: filters.brand.trim() });
    }

    if (filters?.unit) {
      query.andWhere("product.unit = :unit", { unit: filters.unit });
    }

    if (filters?.createdByUserId) {
      query.andWhere("product.createdByUserId = :createdByUserId", {
        createdByUserId: filters.createdByUserId,
      });
    }

    if (filters?.search) {
      query.andWhere(
        "(product.name ILIKE :search OR product.sku ILIKE :search OR product.brand ILIKE :search)",
        { search: `%${filters.search.trim()}%` },
      );
    }

    const [rows, total] = await query
      .orderBy("product.name", "ASC")
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

  async listFilterOptions(idStore: string): Promise<ProductFilterOptions> {
    const rows = await this.repository
      .createQueryBuilder("product")
      .select("product.name", "name")
      .addSelect("product.brand", "brand")
      .addSelect("product.createdByUserId", "createdByUserId")
      .where("product.idStore = :idStore", { idStore })
      .getRawMany<{
        name: string;
        brand: string | null;
        createdByUserId: string;
      }>();

    const names = Array.from(
      new Set(rows.map((row) => row.name).filter(Boolean)),
    ).sort((a, b) => a.localeCompare(b, "pt-BR"));

    const brands = Array.from(
      new Set(
        rows
          .map((row) => row.brand)
          .filter(
            (brand): brand is string => !!brand && brand.trim().length > 0,
          ),
      ),
    ).sort((a, b) => a.localeCompare(b, "pt-BR"));

    const creatorIds = Array.from(
      new Set(rows.map((row) => row.createdByUserId).filter(Boolean)),
    );
    const creatorNames = await this.resolveCreatorNames(creatorIds);
    const creators = creatorIds
      .map((id) => ({ id, name: creatorNames.get(id) ?? "—" }))
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

    return { names, brands, creators };
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
    entity: ProductEntity,
    creatorName: string | null = null,
  ): ProductView {
    return {
      idProduct: entity.idProduct,
      idStore: entity.idStore,
      name: entity.name,
      sku: entity.sku ?? null,
      description: entity.description ?? null,
      brand: entity.brand ?? null,
      kind: entity.kind,
      unit: entity.unit,
      packagingUnit: entity.packagingUnit,
      packSize: Number(entity.packSize ?? 1),
      salePrice:
        entity.salePrice !== null && entity.salePrice !== undefined
          ? Number(entity.salePrice)
          : null,
      status: entity.status,
      createdByUserId: entity.createdByUserId,
      createdByUserName: creatorName,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
