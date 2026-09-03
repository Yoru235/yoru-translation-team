import crypto from "crypto";

export function createUnlockToken(passwordHash: string) {
  return crypto
    .createHash("sha256")
    .update(passwordHash)
    .digest("hex");
}