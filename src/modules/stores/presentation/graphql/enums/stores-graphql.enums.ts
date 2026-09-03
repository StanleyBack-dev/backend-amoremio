import { registerEnumType } from "@nestjs/graphql";
import { StoreRole } from "@/modules/stores/domain/enums/store-role.enum";
import { StorePermission } from "@/modules/stores/domain/enums/store-permission.enum";

registerEnumType(StoreRole, { name: "StoreRole" });
registerEnumType(StorePermission, { name: "StorePermission" });
