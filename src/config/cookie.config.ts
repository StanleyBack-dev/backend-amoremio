import type { CookieOptions } from "express";

const IS_PRODUCTION = process.env.NODE_ENV === "production";
const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN || undefined;

export const ACCESS_TOKEN_COOKIE_NAME = "accessToken";
export const REFRESH_TOKEN_COOKIE_NAME = "refreshToken";

function buildBaseCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: IS_PRODUCTION ? "none" : "lax",
    path: "/",
    domain: COOKIE_DOMAIN,
  };
}

export function buildAccessTokenCookieOptions(maxAge: number): CookieOptions {
  return {
    ...buildBaseCookieOptions(),
    maxAge,
  };
}

export function buildRefreshTokenCookieOptions(maxAge: number): CookieOptions {
  return {
    ...buildBaseCookieOptions(),
    maxAge,
  };
}

export function buildCookieClearOptions(): CookieOptions {
  return buildBaseCookieOptions();
}
