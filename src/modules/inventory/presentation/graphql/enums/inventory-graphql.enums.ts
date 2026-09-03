import { registerEnumType } from "@nestjs/graphql";
import { StockMovementType } from "@/modules/inventory/domain/enums/stock-movement-type.enum";

registerEnumType(StockMovementType, { name: "StockMovementType" });
