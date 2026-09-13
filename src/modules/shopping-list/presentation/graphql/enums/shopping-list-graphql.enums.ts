import { registerEnumType } from "@nestjs/graphql";
import { ShoppingListStatus } from "@/modules/shopping-list/domain/enums/shopping-list-status.enum";

registerEnumType(ShoppingListStatus, { name: "ShoppingListStatus" });
