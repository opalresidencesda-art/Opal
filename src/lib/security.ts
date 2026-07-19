import "server-only";

import { createHash, randomBytes } from "node:crypto";

export function hashAccessToken(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function createAccessToken() {
  return randomBytes(32).toString("base64url");
}

export function isSafeAccessToken(value: string) {
  return /^[A-Za-z0-9_-]{40,80}$/.test(value);
}
