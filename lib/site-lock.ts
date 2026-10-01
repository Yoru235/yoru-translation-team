import crypto from "crypto";

export const SITE_LOCK_COOKIE = "yoru_site_unlocked";

function getEnvValue(key: string): string | undefined {
  if (typeof process !== "undefined" && process.env?.[key]) {
    return process.env[key];
  }
  return undefined;
}

function getSecret() {
  const secret =
    getEnvValue("SITE_LOCK_SECRET") ||
    getEnvValue("JWT_SECRET") ||
    "yoru-default-site-lock-secret-key";

  return secret;
}

export function createSiteLockToken() {
  const secret = getSecret();
  const password = getEnvValue("SITE_PASSWORD") || "";

  return crypto
    .createHmac("sha256", secret)
    .update(`yoru-site-unlocked:${password}`)
    .digest("hex");
}

export function isValidSiteLockToken(
  token: string | undefined
) {
  if (!token) {
    return false;
  }

  const expected = createSiteLockToken();

  if (token.length !== expected.length) {
    return false;
  }

  return crypto.timingSafeEqual(
    Buffer.from(token),
    Buffer.from(expected)
  );
}