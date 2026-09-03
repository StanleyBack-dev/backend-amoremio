import type { Request } from "express";

export function extractClientIp(request: Request): string | undefined {
  const forwardedFor = request.headers["x-forwarded-for"];

  return Array.isArray(forwardedFor)
    ? forwardedFor[0]
    : (forwardedFor?.split(",")[0]?.trim() ?? request.socket.remoteAddress);
}
