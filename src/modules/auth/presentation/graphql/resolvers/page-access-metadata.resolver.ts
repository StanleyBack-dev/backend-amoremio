import { Query, Resolver } from "@nestjs/graphql";
import { ALL_PAGE_ACCESS_KEYS } from "@/modules/auth/domain/enums/page-access-key.enum";
import { GROUP_DEFAULT_PAGE_ACCESS } from "@/modules/auth/domain/constants/group-page-access.constant";
import { PageAccessMetadataResponseDto } from "@/modules/auth/presentation/graphql/dtos/page-access-metadata-response.dto";
import { UserGroup } from "@/modules/users/domain/enums/user-group.enum";

@Resolver()
export class PageAccessMetadataResolver {
  @Query(() => PageAccessMetadataResponseDto, {
    name: "getPageAccessMetadata",
  })
  getPageAccessMetadata(): PageAccessMetadataResponseDto {
    const groupDefaults = Object.entries(GROUP_DEFAULT_PAGE_ACCESS).map(
      ([group, defaultPermissions]) => ({
        group: group as UserGroup,
        defaultPermissions,
      }),
    );

    return {
      allKeys: ALL_PAGE_ACCESS_KEYS,
      groupDefaults,
    };
  }
}
