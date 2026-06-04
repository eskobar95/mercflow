import type { MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"

export function sendZodError(res: MedusaResponse, error: z.ZodError): void {
  res.status(400).json({
    message: "Invalid request",
    issues: error.flatten(),
  })
}
