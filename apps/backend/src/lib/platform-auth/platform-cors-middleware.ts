import type {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

const PLATFORM_CORS =
  process.env.PLATFORM_CORS ?? "http://localhost:5174"

export async function platformCorsMiddleware(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction,
): Promise<void> {
  res.setHeader("Access-Control-Allow-Origin", PLATFORM_CORS)
  res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type")
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS",
  )

  if (req.method === "OPTIONS") {
    res.status(204).end()
    return
  }

  await Promise.resolve(next())
}
