import { createHmac, timingSafeEqual } from "crypto";

// iFood's webhook signature scheme (developer.ifood.com.br → Events →
// Webhook → Validação de assinatura): HMAC-SHA256 of the raw request body
// bytes using the app's client_secret, hex-encoded, sent in the
// X-IFood-Signature header. Must run against the untouched raw bytes —
// their own docs show that reordering/reformatting the same JSON produces a
// different signature, so this can never run against a re-serialized body.
export function verifyIfoodSignature(
  rawBody: Buffer,
  headerSignature: string | undefined,
  clientSecret: string,
): boolean {
  if (!headerSignature) return false;
  const expected = createHmac("sha256", clientSecret)
    .update(rawBody)
    .digest("hex");

  const expectedBuffer = Buffer.from(expected, "utf-8");
  const receivedBuffer = Buffer.from(headerSignature, "utf-8");
  if (expectedBuffer.length !== receivedBuffer.length) return false;
  return timingSafeEqual(expectedBuffer, receivedBuffer);
}
