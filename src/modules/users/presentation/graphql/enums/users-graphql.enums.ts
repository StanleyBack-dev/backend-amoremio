import { registerEnumType } from "@nestjs/graphql";
import { UserGroup } from "@/modules/users/domain/enums/user-group.enum";

registerEnumType(UserGroup, {
  name: "UserGroup",
});
