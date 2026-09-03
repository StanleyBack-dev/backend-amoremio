import { UserGroup } from "@/modules/users/domain/enums/user-group.enum";
import { PageAccessKey } from "@/modules/auth/domain/enums/page-access-key.enum";

export const GROUP_DEFAULT_PAGE_ACCESS: Record<UserGroup, PageAccessKey[]> = {
  [UserGroup.USER]: [
    PageAccessKey.DASHBOARD,
    PageAccessKey.DEBTS,
    PageAccessKey.DEBTS_STATEMENT,
    PageAccessKey.INCOMES,
    PageAccessKey.PAYMENTS,
    PageAccessKey.INCOME_RECEIPTS,
    PageAccessKey.CREDIT_CARDS,
  ],
  [UserGroup.ADMIN]: [
    PageAccessKey.DASHBOARD,
    PageAccessKey.DEBTS,
    PageAccessKey.DEBTS_STATEMENT,
    PageAccessKey.INCOMES,
    PageAccessKey.PAYMENTS,
    PageAccessKey.INCOME_RECEIPTS,
    PageAccessKey.CREDIT_CARDS,
  ],
  [UserGroup.ADMIN_MASTER]: [
    PageAccessKey.DASHBOARD,
    PageAccessKey.DEBTS,
    PageAccessKey.DEBTS_STATEMENT,
    PageAccessKey.INCOMES,
    PageAccessKey.PAYMENTS,
    PageAccessKey.INCOME_RECEIPTS,
    PageAccessKey.CREDIT_CARDS,
    PageAccessKey.ADMIN,
  ],
};
