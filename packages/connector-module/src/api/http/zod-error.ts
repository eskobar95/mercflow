import type { MedusaResponse } from "@medusajs/framework/http"
import type { ZodError } from "zod"

export function sendZodError(res: MedusaResponse, error: ZodError): void {
  res.status(400).json({
    message: "Invalid request",
    issues: error.flatten(),
  })
}
