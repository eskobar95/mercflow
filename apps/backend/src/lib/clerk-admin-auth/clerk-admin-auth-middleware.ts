import { verifyToken } from "@clerk/backend"
import type {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

import {
  readClerkOrganizationIdFromJwt,
  resolveMercflowStoreIdFromClerkSession,
} from "./resolve-clerk-mercflow-store-id"

/**
 * Middleware that verifies an incoming Bearer token as a Clerk JWT for admin
 * routes. When valid it sets:
 *
 *   req.auth_context   — satisfies Medusa's authenticate() pre-set check
 *   req.mercflowStoreId — Medusa store_id resolved from JWT claim or org metadata
 *   req.mercflowClerkOrgId — Clerk organization id from JWT (for team APIs)
 *
 * The middleware is non-blocking: if the token is absent or not a valid Clerk
 * JWT it calls next() without error so Medusa's own authenticate() can still
 * handle session cookies or Medusa-native JWTs (useful for API-key access or
 * the Medusa admin dashboard in development).
 *
 * Mount this BEFORE the Medusa authenticate middleware on /admin* routes.
 */

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY ?? ""
const SUPER_ADMIN_ROLE_ID = "role_super_admin"

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
  mercflowClerkOrgId?: string
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
    const claims = payload as Record<string, unknown>

    const userId = typeof payload.sub === "string" ? payload.sub : null
    if (!userId) {
      await Promise.resolve(next())
      return
    }

    const storeId = await resolveMercflowStoreIdFromClerkSession({
      payload: claims,
      secretKey: CLERK_SECRET_KEY,
    })
    const clerkOrgId = readClerkOrganizationIdFromJwt(claims)

    const typedReq = req as ClerkAdminRequest
    typedReq.auth_context = {
      actor_id: userId,
      actor_type: "user",
      auth_identity_id: userId,
      app_metadata: storeId
        ? {
            roles: [SUPER_ADMIN_ROLE_ID],
          }
        : {},
      user_metadata: {},
    }

    if (storeId) {
      typedReq.mercflowStoreId = storeId
    }

    if (clerkOrgId) {
      typedReq.mercflowClerkOrgId = clerkOrgId
    }
  } catch {
    // Not a valid Clerk JWT — fall through to Medusa's own authenticate().
  }

  await Promise.resolve(next())
}
