import { registerEnumType } from "@nestjs/graphql";
import { ProductionOrderStatus } from "@/modules/production/domain/enums/production-order-status.enum";

registerEnumType(ProductionOrderStatus, { name: "ProductionOrderStatus" });
