import { MedusaError } from "@medusajs/utils"
import { z } from "zod"

function formatZodIssues(error: z.ZodError): string {
  const detail = error.issues
    .map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join(".") : "request"
      return `${path}: ${issue.message}`
    })
    .join("; ")
  return detail.length > 0 ? detail : "Invalid request"
}

export function sendZodError(error: z.ZodError): never {
  throw new MedusaError(MedusaError.Types.INVALID_DATA, formatZodIssues(error))
}
