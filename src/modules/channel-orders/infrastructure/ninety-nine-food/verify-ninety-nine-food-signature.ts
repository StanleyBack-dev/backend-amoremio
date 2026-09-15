import { createHash } from "crypto";

// 99Food's webhook signature scheme (developer-food.99app.com → Order API →
// Authentication & Signature Mechanism): MD5 of the raw request body bytes
// concatenated with the app secret, compared against the didi-header-sign
// header — not HMAC, and not the usual "sort params and join" scheme they
// use for signing our own outbound API calls.
export function verifyNinetyNineFoodSignature(
  rawBody: Buffer,
  headerSignature: string | undefined,
  appSecret: string,
): boolean {
  if (!headerSignature) return false;
  const expected = createHash("md5")
    .update(rawBody.toString("utf-8") + appSecret)
    .digest("hex");
  return expected === headerSignature;
}
