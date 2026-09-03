import * as Joi from "joi";

export const envValidationSchema = Joi.object({
  // === APP CONFIGS GERAIS ===
  NODE_ENV: Joi.string()
    .valid("development", "production", "test")
    .default("development"),
  PORT: Joi.number().default(4000),
  FRONTEND_URL: Joi.string().uri().required(),
  FRONTEND_URL_WWW: Joi.string().uri().optional(),
  COOKIE_DOMAIN: Joi.string().allow("").optional(),

  // === BOOTSTRAP ADMIN MASTER ===
  BOOTSTRAP_ADMIN_MASTER_ENABLED: Joi.boolean()
    .truthy("true")
    .falsy("false")
    .default(false),
  BOOTSTRAP_ADMIN_MASTER_NAME: Joi.string().when(
    "BOOTSTRAP_ADMIN_MASTER_ENABLED",
    {
      is: true,
      then: Joi.required(),
      otherwise: Joi.optional(),
    },
  ),
  BOOTSTRAP_ADMIN_MASTER_EMAIL: Joi.string()
    .email()
    .when("BOOTSTRAP_ADMIN_MASTER_ENABLED", {
      is: true,
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
  BOOTSTRAP_ADMIN_MASTER_USERNAME: Joi.string()
    .min(3)
    .when("BOOTSTRAP_ADMIN_MASTER_ENABLED", {
      is: true,
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
  BOOTSTRAP_ADMIN_MASTER_PASSWORD: Joi.string()
    .min(8)
    .when("BOOTSTRAP_ADMIN_MASTER_ENABLED", {
      is: true,
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
  BOOTSTRAP_STORE_NAME: Joi.string().allow("").optional(),

  // === DATABASE ===
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().default(5432),
  DB_USER: Joi.string().required(),
  DB_PASS: Joi.string().allow(""),
  DB_NAME: Joi.string().required(),
  DB_SSL: Joi.boolean().truthy("true").falsy("false").default(false),
  DB_TIMEZONE: Joi.string().default("America/Sao_Paulo"),
  TYPEORM_LOGGING: Joi.boolean().truthy("true").falsy("false").default(false),

  // === MAIL / BREVO ===
  BREVO_API_KEY: Joi.string().min(10).allow("").optional(),
  MAIL_FROM_EMAIL: Joi.string().email().required(),
  MAIL_FROM_NAME: Joi.string().min(2).required(),

  MAIL_REPLY_TO_EMAIL: Joi.string().email().allow("").optional(),
  MAIL_REPLY_TO_NAME: Joi.string().min(2).allow("").optional(),
  MAIL_COMPANY_NOTIFICATION_EMAIL: Joi.string().email().allow("").optional(),
  PASSWORD_RECOVERY_CODE_TTL_MINUTES: Joi.number().integer().min(1).default(10),
  PASSWORD_RECOVERY_RESET_TTL_MINUTES: Joi.number()
    .integer()
    .min(1)
    .default(15),
  PASSWORD_RECOVERY_MAX_ATTEMPTS: Joi.number()
    .integer()
    .min(1)
    .max(10)
    .default(5),

  // === JWT ===
  JWT_ACCESS_SECRET: Joi.string()
    .min(32)
    .when("NODE_ENV", {
      is: "production",
      then: Joi.required(),
      otherwise: Joi.string()
        .min(32)
        .default("dev-access-secret-change-me-2026-royal-copeiras"),
    }),
  JWT_REFRESH_SECRET: Joi.string()
    .min(32)
    .when("NODE_ENV", {
      is: "production",
      then: Joi.required(),
      otherwise: Joi.string()
        .min(32)
        .default("dev-refresh-secret-change-me-2026-royal-copeiras"),
    }),
  JWT_ACCESS_EXPIRES_IN: Joi.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default("30d"),

  // === RATE LIMITING (Upstash Redis) ===
  UPSTASH_REDIS_REST_URL: Joi.string().uri().allow("").optional(),
  UPSTASH_REDIS_REST_TOKEN: Joi.string().allow("").optional(),

  RATE_LIMIT_AUTH_WINDOW_SECONDS: Joi.number().integer().min(1).default(60),
  RATE_LIMIT_AUTH_MAX: Joi.number().integer().min(1).default(10),

  RATE_LIMIT_PASSWORD_RECOVERY_WINDOW_SECONDS: Joi.number()
    .integer()
    .min(1)
    .default(900),
  RATE_LIMIT_PASSWORD_RECOVERY_MAX: Joi.number().integer().min(1).default(5),

  RATE_LIMIT_MUTATION_WINDOW_SECONDS: Joi.number().integer().min(1).default(60),
  RATE_LIMIT_MUTATION_MAX: Joi.number().integer().min(1).default(60),

  RATE_LIMIT_QUERY_WINDOW_SECONDS: Joi.number().integer().min(1).default(60),
  RATE_LIMIT_QUERY_MAX: Joi.number().integer().min(1).default(120),

  // === SENTRY / MONITORING ===
  SENTRY_DSN: Joi.string().uri().allow("").optional(),
  SENTRY_ENVIRONMENT: Joi.string()
    .valid("development", "beta", "production")
    .allow("")
    .optional(),

  // === STORAGE (Neon S3-compatible bucket) ===
  AWS_ENDPOINT_URL_S3: Joi.string().uri().allow("").optional(),
  AWS_ACCESS_KEY_ID: Joi.string().allow("").optional(),
  AWS_SECRET_ACCESS_KEY: Joi.string().allow("").optional(),
  AWS_REGION: Joi.string().allow("").optional(),
  AWS_S3_BUCKET: Joi.string().allow("").optional(),
});
