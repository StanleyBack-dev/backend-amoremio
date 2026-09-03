import { HttpStatus } from "@nestjs/common";

export const authErrors = {
  accessTokenMissing: {
    code: "AUTH_ACCESS_TOKEN_MISSING",
    status: HttpStatus.UNAUTHORIZED,
    message: "Token de acesso não informado.",
  },
  userUnauthenticated: {
    code: "AUTH_USER_UNAUTHENTICATED",
    status: HttpStatus.UNAUTHORIZED,
    message: "Usuário não autenticado.",
  },
  invalidCredentials: {
    code: "AUTH_INVALID_CREDENTIALS",
    status: HttpStatus.UNAUTHORIZED,
    message: "Username ou senha inválidos.",
  },
  invalidCurrentPassword: {
    code: "AUTH_INVALID_CURRENT_PASSWORD",
    status: HttpStatus.UNAUTHORIZED,
    message: "Senha atual inválida.",
  },
  invalidToken: {
    code: "AUTH_INVALID_TOKEN",
    status: HttpStatus.UNAUTHORIZED,
    message: "Token inválido.",
  },
  invalidOrExpiredToken: {
    code: "AUTH_INVALID_OR_EXPIRED_TOKEN",
    status: HttpStatus.UNAUTHORIZED,
    message: "Token inválido ou expirado.",
  },
  inactiveUser: {
    code: "AUTH_INACTIVE_USER",
    status: HttpStatus.UNAUTHORIZED,
    message: "Usuário inativo.",
  },
  credentialLocked: {
    code: "AUTH_CREDENTIAL_LOCKED",
    status: HttpStatus.UNAUTHORIZED,
    message: "Credencial temporariamente bloqueada.",
  },
  passwordRecoveryCodeInvalidOrExpired: {
    code: "AUTH_PASSWORD_RECOVERY_CODE_INVALID_OR_EXPIRED",
    status: HttpStatus.BAD_REQUEST,
    message: "Codigo de recuperacao invalido ou expirado.",
  },
  passwordRecoveryNotAllowed: {
    code: "AUTH_PASSWORD_RECOVERY_NOT_ALLOWED",
    status: HttpStatus.BAD_REQUEST,
    message: "Nao foi possivel autorizar a redefinicao da senha.",
  },
  invalidOrRevokedSession: {
    code: "AUTH_INVALID_OR_REVOKED_SESSION",
    status: HttpStatus.UNAUTHORIZED,
    message: "Sessão inválida ou revogada.",
  },
  expiredSession: {
    code: "AUTH_EXPIRED_SESSION",
    status: HttpStatus.UNAUTHORIZED,
    message: "Sessão expirada.",
  },
  credentialMissingForRefresh: {
    code: "AUTH_CREDENTIAL_MISSING_FOR_REFRESH",
    status: HttpStatus.UNAUTHORIZED,
    message: "Credencial não encontrada para renovar sessão.",
  },
  firstAccessPending: {
    code: "AUTH_FIRST_ACCESS_PENDING",
    status: HttpStatus.FORBIDDEN,
    message: "Primeiro acesso pendente. Altere sua senha para continuar.",
  },
  termsAcceptancePending: {
    code: "AUTH_TERMS_ACCEPTANCE_PENDING",
    status: HttpStatus.FORBIDDEN,
    message:
      "É necessário aceitar os Termos de Uso e a Política de Privacidade para continuar.",
  },
  credentialNotFoundForUser: {
    code: "AUTH_CREDENTIAL_NOT_FOUND_FOR_USER",
    status: HttpStatus.NOT_FOUND,
    message: "Credencial de autenticação não encontrada para este usuário.",
  },
  credentialProvisionUserNotFound: {
    code: "AUTH_CREDENTIAL_PROVISION_USER_NOT_FOUND",
    status: HttpStatus.NOT_FOUND,
    message: "Usuário não encontrado para provisionar credencial.",
  },
  credentialAlreadyExistsForUser: {
    code: "AUTH_CREDENTIAL_ALREADY_EXISTS_FOR_USER",
    status: HttpStatus.CONFLICT,
    message: "Este usuário já possui credencial de autenticação.",
  },
  duplicateUsername: {
    code: "AUTH_DUPLICATE_USERNAME",
    status: HttpStatus.CONFLICT,
    message: "Username já está em uso.",
  },
  newPasswordMustDiffer: {
    code: "AUTH_NEW_PASSWORD_MUST_DIFFER",
    status: HttpStatus.BAD_REQUEST,
    message: "A nova senha deve ser diferente da senha atual.",
  },
  bootstrapEmailInUse: {
    code: "AUTH_BOOTSTRAP_EMAIL_IN_USE",
    status: HttpStatus.CONFLICT,
    message:
      "Nao foi possivel criar o ADMIN_MASTER inicial: e-mail ja esta em uso.",
  },
  bootstrapUsernameInUse: {
    code: "AUTH_BOOTSTRAP_USERNAME_IN_USE",
    status: HttpStatus.CONFLICT,
    message:
      "Nao foi possivel criar o ADMIN_MASTER inicial: username ja esta em uso.",
  },
  bootstrapIncompleteConfig: {
    code: "AUTH_BOOTSTRAP_INCOMPLETE_CONFIG",
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    message: "Configuracao incompleta para bootstrap do ADMIN_MASTER inicial.",
  },
} as const;
