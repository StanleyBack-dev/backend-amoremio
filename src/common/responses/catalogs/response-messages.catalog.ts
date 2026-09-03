export const RESPONSE_MESSAGES = {
  auth: {
    logout: {
      code: "AUTH_LOGOUT_SUCCESS",
      message: "Logout realizado com sucesso.",
    },
    passwordChanged: {
      code: "AUTH_PASSWORD_CHANGED",
      message: "Senha alterada com sucesso.",
    },
    passwordRecoveryRequested: {
      code: "AUTH_PASSWORD_RECOVERY_REQUESTED",
      message:
        "Se o e-mail estiver cadastrado, voce recebera um codigo para recuperar a senha.",
    },
    passwordRecoveryCodeValidated: {
      code: "AUTH_PASSWORD_RECOVERY_CODE_VALIDATED",
      message: "Codigo validado com sucesso.",
    },
    passwordRecovered: {
      code: "AUTH_PASSWORD_RECOVERED",
      message: "Senha redefinida com sucesso.",
    },
    onboardingTourCompleted: {
      code: "AUTH_ONBOARDING_TOUR_COMPLETED",
      message: "Tour de apresentação concluído.",
    },
  },
  users: {
    created: {
      code: "USER_CREATED",
      message: "Usuário criado com sucesso.",
    },
    updated: {
      code: "USER_UPDATED",
      message: "Usuário atualizado com sucesso.",
    },
    accessUpdated: {
      code: "USER_ACCESS_UPDATED",
      message: "Acesso do usuário atualizado com sucesso.",
    },
    unlocked: {
      code: "USER_UNLOCKED",
      message: "Usuário desbloqueado com sucesso.",
    },
    permissionsUpdated: {
      code: "USER_PAGE_PERMISSIONS_UPDATED",
      message: "Permissões de páginas do usuário atualizadas com sucesso.",
    },
    listed: {
      code: "USERS_LISTED",
      message: "Usuários carregados com sucesso.",
    },
  },
  stores: {
    created: {
      code: "STORE_CREATED",
      message: "Loja criada com sucesso.",
    },
    updated: {
      code: "STORE_UPDATED",
      message: "Loja atualizada com sucesso.",
    },
    listed: {
      code: "STORES_LISTED",
      message: "Lojas carregadas com sucesso.",
    },
    memberAdded: {
      code: "STORE_MEMBER_ADDED",
      message: "Membro adicionado à loja com sucesso.",
    },
    memberRoleUpdated: {
      code: "STORE_MEMBER_ROLE_UPDATED",
      message: "Papel do membro atualizado com sucesso.",
    },
    memberRemoved: {
      code: "STORE_MEMBER_REMOVED",
      message: "Membro removido da loja com sucesso.",
    },
    membersListed: {
      code: "STORE_MEMBERS_LISTED",
      message: "Membros da loja carregados com sucesso.",
    },
  },
  catalog: {
    created: {
      code: "PRODUCT_CREATED",
      message: "Produto criado com sucesso.",
    },
    updated: {
      code: "PRODUCT_UPDATED",
      message: "Produto atualizado com sucesso.",
    },
    listed: {
      code: "PRODUCTS_LISTED",
      message: "Produtos carregados com sucesso.",
    },
  },
  purchasing: {
    created: {
      code: "PURCHASE_CREATED",
      message: "Rascunho de compra criado.",
    },
    updated: {
      code: "PURCHASE_UPDATED",
      message: "Compra atualizada com sucesso.",
    },
    finalized: {
      code: "PURCHASE_FINALIZED",
      message: "Compra finalizada — estoque atualizado.",
    },
    cancelled: {
      code: "PURCHASE_CANCELLED",
      message: "Compra cancelada.",
    },
    listed: {
      code: "PURCHASES_LISTED",
      message: "Compras carregadas com sucesso.",
    },
  },
  sales: {
    created: {
      code: "SALES_ORDER_CREATED",
      message: "Ordem de venda criada.",
    },
    updated: {
      code: "SALES_ORDER_UPDATED",
      message: "Ordem de venda atualizada.",
    },
    confirmed: {
      code: "SALES_ORDER_CONFIRMED",
      message: "Venda confirmada — estoque baixado.",
    },
    cancelled: {
      code: "SALES_ORDER_CANCELLED",
      message: "Venda cancelada.",
    },
    listed: {
      code: "SALES_ORDERS_LISTED",
      message: "Vendas carregadas com sucesso.",
    },
  },
  production: {
    recipeCreated: {
      code: "RECIPE_CREATED",
      message: "Ficha técnica criada com sucesso.",
    },
    recipeUpdated: {
      code: "RECIPE_UPDATED",
      message: "Ficha técnica atualizada com sucesso.",
    },
    recipesListed: {
      code: "RECIPES_LISTED",
      message: "Fichas técnicas carregadas com sucesso.",
    },
    orderCreated: {
      code: "PRODUCTION_ORDER_CREATED",
      message: "Ordem de produção criada.",
    },
    orderUpdated: {
      code: "PRODUCTION_ORDER_UPDATED",
      message: "Ordem de produção atualizada.",
    },
    orderConcluded: {
      code: "PRODUCTION_ORDER_CONCLUDED",
      message: "Produção concluída — estoque atualizado.",
    },
    orderCancelled: {
      code: "PRODUCTION_ORDER_CANCELLED",
      message: "Ordem de produção cancelada.",
    },
    ordersListed: {
      code: "PRODUCTION_ORDERS_LISTED",
      message: "Ordens de produção carregadas com sucesso.",
    },
  },
  inventory: {
    adjusted: {
      code: "STOCK_ADJUSTED",
      message: "Estoque ajustado com sucesso.",
    },
    listed: {
      code: "STOCK_LISTED",
      message: "Estoque carregado com sucesso.",
    },
    movementsListed: {
      code: "STOCK_MOVEMENTS_LISTED",
      message: "Movimentações de estoque carregadas com sucesso.",
    },
  },
  brands: {
    created: {
      code: "BRAND_CREATED",
      message: "Marca criada com sucesso.",
    },
    updated: {
      code: "BRAND_UPDATED",
      message: "Marca atualizada com sucesso.",
    },
    listed: {
      code: "BRANDS_LISTED",
      message: "Marcas carregadas com sucesso.",
    },
  },
  suppliers: {
    created: {
      code: "SUPPLIER_CREATED",
      message: "Fornecedor criado com sucesso.",
    },
    updated: {
      code: "SUPPLIER_UPDATED",
      message: "Fornecedor atualizado com sucesso.",
    },
    listed: {
      code: "SUPPLIERS_LISTED",
      message: "Fornecedores carregados com sucesso.",
    },
  },
  profiles: {
    updated: {
      code: "PROFILE_UPDATED",
      message: "Perfil atualizado com sucesso.",
    },
  },
  legal: {
    termsAccepted: {
      code: "LEGAL_TERMS_ACCEPTED",
      message: "Termos de Uso e Política de Privacidade aceitos com sucesso.",
    },
  },
} as const;
