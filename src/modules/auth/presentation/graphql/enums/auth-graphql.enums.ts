import { registerEnumType } from "@nestjs/graphql";
import { PageAccessKey } from "@/modules/auth/domain/enums/page-access-key.enum";

registerEnumType(PageAccessKey, {
  name: "PageAccessKey",
});
