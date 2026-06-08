import { MedusaError } from "@medusajs/utils"
import { z } from "zod"

function formatZodIssues(error: z.ZodError): string {
  const flattened = error.flatten()
  const fieldMessages = Object.entries(flattened.fieldErrors)
    .map(([field, messages]) => `${field}: ${(messages ?? []).join(", ")}`)
    .join("; ")
  const formMessages = flattened.formErrors.join("; ")
  const detail = [fieldMessages, formMessages].filter((part) => part.length > 0).join("; ")
  return detail.length > 0 ? detail : "Invalid request"
}

export function sendZodError(error: z.ZodError): never {
  throw new MedusaError(MedusaError.Types.INVALID_DATA, formatZodIssues(error))
}
