import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from "typeorm";
import { StockMovementType } from "@/modules/inventory/domain/enums/stock-movement-type.enum";

// Append-only ledger of every stock change. Each row snapshots the
// resulting quantity and average cost so history stays auditable even if
// the product or the aggregation logic changes later.
@Entity("tb_stock_movements")
export class StockMovementEntity {
  @PrimaryGeneratedColumn("uuid", { name: "idtb_stock_movements" })
  idStockMovement!: string;

  @Column({ name: "idtb_stores", type: "uuid" })
  @Index()
  idStore!: string;

  @Column({ name: "idtb_products", type: "uuid" })
  @Index()
  idProduct!: string;

  @Column({ type: "enum", enum: StockMovementType })
  type!: StockMovementType;

  @Column({ type: "numeric", precision: 14, scale: 3 })
  quantity!: string;

  // 6 decimals: cheap-by-weight inputs (flour, sugar) cost fractions of a
  // cent per gram — 4 decimals would round R$ 0,00435/g visibly.
  @Column({ name: "unit_cost", type: "numeric", precision: 16, scale: 6 })
  unitCost!: string;

  @Column({
    name: "resulting_quantity",
    type: "numeric",
    precision: 14,
    scale: 3,
  })
  resultingQuantity!: string;

  @Column({
    name: "resulting_average_cost",
    type: "numeric",
    precision: 16,
    scale: 6,
  })
  resultingAverageCost!: string;

  @Column({ name: "source_type", type: "varchar", length: 40, nullable: true })
  sourceType?: string | null;

  @Column({ name: "source_id", type: "uuid", nullable: true })
  sourceId?: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  note?: string | null;

  @Column({ name: "created_by_user_id", type: "uuid" })
  createdByUserId!: string;

  @Column({ name: "occurred_at", type: "timestamptz" })
  occurredAt!: Date;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
}
