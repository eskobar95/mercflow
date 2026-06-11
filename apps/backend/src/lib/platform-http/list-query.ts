import type { MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"

export const platformListQuerySchema = z
  .object({
    limit: z.coerce.number().int().min(1).max(100).optional(),
    offset: z.coerce.number().int().min(0).optional(),
  })
  .strict()

export const platformEmailDeliveriesQuerySchema = platformListQuerySchema.extend({
  q: z.string().trim().min(1).max(255).optional(),
})

export const platformAuditQuerySchema = platformListQuerySchema.extend({
  from: z.string().datetime({ offset: true }).optional(),
  to: z.string().datetime({ offset: true }).optional(),
})

export function resolvePlatformListLimit(limit: number | undefined): number {
  return limit ?? 50
}

export function resolvePlatformListOffset(offset: number | undefined): number {
  return offset ?? 0
}

export function sendPlatformZodError(
  res: MedusaResponse,
  error: z.ZodError,
): void {
  const message = error.issues.map((issue) => issue.message).join("; ")
  res.status(400).json({ message })
}
