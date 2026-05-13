import { createHash, randomBytes } from "crypto";

export function createRawPasswordSetupToken() {
  return randomBytes(32).toString("base64url");
}

export function hashPasswordSetupToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function getPasswordSetupExpiry() {
  return new Date(Date.now() + 24 * 60 * 60 * 1000);
}
