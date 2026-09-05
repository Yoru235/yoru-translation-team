import crypto from "crypto";

export const SITE_LOCK_COOKIE = "yoru_site_unlocked";

function getSecret() {
  const secret = process.env.SITE_LOCK_SECRET;

  if (!secret) {
    throw new Error("SITE_LOCK_SECRET chưa được cấu hình.");
  }

  return secret;
}

export function createSiteLockToken() {
  return crypto
    .createHmac("sha256", getSecret())
    .update("yoru-site-unlocked")
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