import { createHash, randomUUID } from "node:crypto"

export const INVITE_TTL_HOURS = 72

export function generateInviteToken(): string {
  return randomUUID()
}

export function hashInviteToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex")
}

export function getInviteExpiresAt(from: Date = new Date()): Date {
  return new Date(from.getTime() + INVITE_TTL_HOURS * 60 * 60 * 1000)
}
