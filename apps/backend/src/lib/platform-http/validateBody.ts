import type { MedusaRequest } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/utils"
import { z, type ZodSchema } from "zod"

function formatZodIssues(error: z.ZodError): string {
  return error.issues.map((issue) => issue.message).join(", ")
}

export function validateBody<T>(schema: ZodSchema<T>, req: MedusaRequest): T {
  const result = schema.safeParse(req.body)
  if (!result.success) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      formatZodIssues(result.error),
    )
  }
  return result.data
}

export function validateParams<T>(schema: ZodSchema<T>, params: unknown): T {
  const result = schema.safeParse(params)
  if (!result.success) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      formatZodIssues(result.error),
    )
  }
  return result.data
}

export const platformStoreIdParamsSchema = z
  .object({
    store_id: z.string().trim().min(1),
  })
  .strict()

export const platformJobIdParamsSchema = z
  .object({
    jobId: z.string().trim().min(1),
  })
  .strict()

export const platformQueueJobParamsSchema = z
  .object({
    name: z.string().trim().min(1),
    id: z.string().trim().min(1),
  })
  .strict()

export const platformTenantIdParamsSchema = z
  .object({
    id: z.string().trim().min(1),
  })
  .strict()
