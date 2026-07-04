import { verifyToken } from "@clerk/backend"
import type {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

/**
 * Middleware that verifies an incoming Bearer token as a Clerk JWT for admin
 * routes. When valid it sets:
 *
 *   req.auth_context   — satisfies Medusa's authenticate() pre-set check
 *   req.mercflowStoreId — org_id from the Clerk session maps to store_id
 *
 * The middleware is non-blocking: if the token is absent or not a valid Clerk
 * JWT it calls next() without error so Medusa's own authenticate() can still
 * handle session cookies or Medusa-native JWTs (useful for API-key access or
 * the Medusa admin dashboard in development).
 *
 * Mount this BEFORE the Medusa authenticate middleware on /admin* routes.
 */

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY ?? ""

function extractBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader) return null
  const match = /^Bearer\s+(\S+)$/i.exec(authHeader)
  return match?.[1] ?? null
}

type ClerkAdminRequest = MedusaRequest & {
  auth_context?: {
    actor_id: string
    actor_type: string
    auth_identity_id: string
    app_metadata: Record<string, unknown>
    user_metadata: Record<string, unknown>
  }
  mercflowStoreId?: string
}

export async function clerkAdminAuthMiddleware(
  req: MedusaRequest,
  _res: MedusaResponse,
  next: MedusaNextFunction,
): Promise<void> {
  if (!CLERK_SECRET_KEY) {
    await Promise.resolve(next())
    return
  }

  const token = extractBearerToken(req.headers.authorization)
  if (!token) {
    await Promise.resolve(next())
    return
  }

  try {
    const payload = await verifyToken(token, { secretKey: CLERK_SECRET_KEY })

    const userId = typeof payload.sub === "string" ? payload.sub : null
    if (!userId) {
      await Promise.resolve(next())
      return
    }

    // org_id from the active Clerk organization maps to a MercFlow store_id.
    const orgId =
      typeof (payload as Record<string, unknown>).org_id === "string" &&
      ((payload as Record<string, unknown>).org_id as string).length > 0
        ? ((payload as Record<string, unknown>).org_id as string)
        : null

    const typedReq = req as ClerkAdminRequest
    typedReq.auth_context = {
      actor_id: userId,
      actor_type: "user",
      auth_identity_id: userId,
      app_metadata: {},
      user_metadata: {},
    }

    if (orgId) {
      typedReq.mercflowStoreId = orgId
    }
  } catch {
    // Not a valid Clerk JWT — fall through to Medusa's own authenticate().
  }

  await Promise.resolve(next())
}
