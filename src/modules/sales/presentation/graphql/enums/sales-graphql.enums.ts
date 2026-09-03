import { registerEnumType } from "@nestjs/graphql";
import { SalesChannel } from "@/modules/sales/domain/enums/sales-channel.enum";
import { SalesDiscountMode } from "@/modules/sales/domain/enums/sales-discount-mode.enum";
import { SalesOrderStatus } from "@/modules/sales/domain/enums/sales-order-status.enum";

registerEnumType(SalesOrderStatus, { name: "SalesOrderStatus" });
registerEnumType(SalesChannel, { name: "SalesChannel" });
registerEnumType(SalesDiscountMode, { name: "SalesDiscountMode" });
