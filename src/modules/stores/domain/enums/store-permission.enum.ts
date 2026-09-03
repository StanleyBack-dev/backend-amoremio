// Business actions that can be authorized within a store. Every use case of
// a store-scoped context (catalog, inventory, purchasing, sales,
// finance-dashboard) calls StoreAuthorizationService.assertStorePermission
// with the matching permission.
export enum StorePermission {
  VIEW_STORE = "VIEW_STORE",
  MANAGE_STORE = "MANAGE_STORE",
  MANAGE_STORE_MEMBERS = "MANAGE_STORE_MEMBERS",

  VIEW_DASHBOARD = "VIEW_DASHBOARD",

  MANAGE_PRODUCTS = "MANAGE_PRODUCTS",

  VIEW_INVENTORY = "VIEW_INVENTORY",
  ADJUST_INVENTORY = "ADJUST_INVENTORY",

  REGISTER_PURCHASE = "REGISTER_PURCHASE",
  FINALIZE_PURCHASE = "FINALIZE_PURCHASE",

  REGISTER_SALE = "REGISTER_SALE",
  CONFIRM_SALE = "CONFIRM_SALE",

  MANAGE_RECIPES = "MANAGE_RECIPES",
  REGISTER_PRODUCTION = "REGISTER_PRODUCTION",
  COMPLETE_PRODUCTION = "COMPLETE_PRODUCTION",
}
