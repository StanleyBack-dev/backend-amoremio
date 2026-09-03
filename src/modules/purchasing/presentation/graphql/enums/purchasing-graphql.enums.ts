import { registerEnumType } from "@nestjs/graphql";
import { PurchaseDiscountMode } from "@/modules/purchasing/domain/enums/purchase-discount-mode.enum";
import { PurchaseStatus } from "@/modules/purchasing/domain/enums/purchase-status.enum";

registerEnumType(PurchaseStatus, { name: "PurchaseStatus" });
registerEnumType(PurchaseDiscountMode, { name: "PurchaseDiscountMode" });
