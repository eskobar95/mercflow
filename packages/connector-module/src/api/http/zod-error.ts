import { MedusaError } from "@medusajs/utils"
import type { ZodError } from "zod"

function formatZodIssues(error: ZodError): string {
  const flattened = error.flatten()
  const fieldMessages = Object.entries(flattened.fieldErrors)
    .map(([field, messages]) => `${field}: ${(messages ?? []).join(", ")}`)
    .join("; ")
  const formMessages = flattened.formErrors.join("; ")
  const detail = [fieldMessages, formMessages].filter((part) => part.length > 0).join("; ")
  return detail.length > 0 ? detail : "Invalid request"
}

export function sendZodError(error: ZodError): never {
  throw new MedusaError(MedusaError.Types.INVALID_DATA, formatZodIssues(error))
}
