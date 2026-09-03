// Must be imported before any other module (see serverless.ts / main.ts) —
// Sentry.init() has to run before the rest of the app is required so it can
// capture failures that happen during the bootstrap itself.
import * as Sentry from "@sentry/nestjs";
import { config as loadDotenv } from "dotenv";
import { resolve } from "path";
import { sanitizeSensitiveData } from "./common/security/sanitize-sensitive-data";

// process.env isn't populated from .env.development/.env.local yet at this
// point — that normally happens inside AppConfigModule's ConfigModule.forRoot(),
// which only runs later, deep inside NestFactory.create(). In production
// (Vercel) this doesn't matter because real env vars are already in
// process.env before Node even starts, but locally we need our own load
// here, mirroring config.module.ts's own file order/precedence.
if (process.env.NODE_ENV !== "production") {
  loadDotenv({ path: resolve(process.cwd(), ".env.development") });
  loadDotenv({ path: resolve(process.cwd(), ".env.local"), override: true });
}

const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV,
    // This project cares about error visibility, not APM — keep tracing off
    // by default so the free-tier error quota isn't shared with unrelated
    // performance-unit accounting.
    tracesSampleRate: 0,
    beforeSend(event) {
      return sanitizeSensitiveData(event);
    },
  });
}
