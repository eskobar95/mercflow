import { verifyToken } from "@clerk/backend"
import type {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

import {
  extractClerkEmailFromPayload,
  isAllowedOperatorEmail,
} from "./extract-clerk-email"

function getPlatformClerkSecretKey(): string {
  return process.env.PLATFORM_CLERK_SECRET_KEY ?? ""
}

function getPlatformAllowedEmailDomain(): string {
  return process.env.PLATFORM_ALLOWED_EMAIL_DOMAIN ?? "mercflow.shop"
}

function extractBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader) {
    return null
  }

  const match = /^Bearer\s+(\S+)$/i.exec(authHeader)
  return match?.[1] ?? null
}

export type PlatformOperator = {
  userId: string
  email: string
}

export type PlatformAuthRequest = MedusaRequest & {
  platformOperator?: PlatformOperator
}

export async function clerkPlatformAuthMiddleware(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction,
): Promise<void> {
  if (req.path === "/platform/invites/validate" && req.method === "GET") {
    await Promise.resolve(next())
    return
  }

  const platformClerkSecretKey = getPlatformClerkSecretKey()
  if (!platformClerkSecretKey) {
    res.status(503).json({
      message:
        "Platform auth is not configured. Set PLATFORM_CLERK_SECRET_KEY on the backend.",
    })
    return
  }

  const token = extractBearerToken(req.headers.authorization)
  if (!token) {
    res.status(401).json({ message: "Missing Clerk JWT" })
    return
  }

  try {
    const payload = (await verifyToken(token, {
      secretKey: platformClerkSecretKey,
    })) as Record<string, unknown>

    const userId = typeof payload.sub === "string" ? payload.sub : null
    if (!userId) {
      res.status(401).json({ message: "Invalid Clerk JWT" })
      return
    }

    const email = extractClerkEmailFromPayload(payload)
    if (!email) {
      res.status(403).json({
        message:
          "Operator email missing from Clerk JWT. Add email to the mercflow-platform JWT template.",
      })
      return
    }

    const allowedDomain = getPlatformAllowedEmailDomain()
    if (!isAllowedOperatorEmail(email, allowedDomain)) {
      res.status(403).json({
        message: `Access restricted to @${allowedDomain} accounts`,
      })
      return
    }

    const typedReq = req as PlatformAuthRequest
    typedReq.platformOperator = { userId, email }
    await Promise.resolve(next())
  } catch {
    res.status(401).json({ message: "Invalid Clerk JWT" })
  }
}
