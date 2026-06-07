import { useQuery } from "@tanstack/react-query"
import { useMemo } from "react"

import {
  buildMedusaAdminJsonHeaders,
  parseMedusaAdminJsonResponse,
  resolveMedusaAdminBackendUrl,
} from "@/medusa-admin/medusaAdminFetch"

type AdminSession = {
  displayName: string
  role: string
  initials: string
}

/** Generic fallback when the Medusa session endpoint is unavailable (local dev). */
const FALLBACK_ADMIN_SESSION: AdminSession = {
  displayName: "Admin",
  role: "Member",
  initials: "AD",
}

function deriveInitials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "AD"
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

function parseAdminUserPayload(payload: unknown): AdminSession | null {
  if (typeof payload !== "object" || payload === null || !("user" in payload)) {
    return null
  }
  const user = (payload as { user: unknown }).user
  if (typeof user !== "object" || user === null) return null

  const record = user as Record<string, unknown>
  const firstName = typeof record.first_name === "string" ? record.first_name.trim() : ""
  const lastName = typeof record.last_name === "string" ? record.last_name.trim() : ""
  const email = typeof record.email === "string" ? record.email.trim() : ""

  const displayName =
    [firstName, lastName].filter(Boolean).join(" ") ||
    email.split("@")[0]?.trim() ||
    FALLBACK_ADMIN_SESSION.displayName

  return {
    displayName,
    role: FALLBACK_ADMIN_SESSION.role,
    initials: deriveInitials(displayName),
  }
}

async function fetchAdminSession(): Promise<AdminSession> {
  const baseUrl = resolveMedusaAdminBackendUrl()
  if (baseUrl === null) {
    return FALLBACK_ADMIN_SESSION
  }

  const response = await fetch(`${baseUrl}/admin/users/me`, {
    credentials: "include",
    headers: buildMedusaAdminJsonHeaders(),
  })

  if (!response.ok) {
    return FALLBACK_ADMIN_SESSION
  }

  const payload: unknown = await parseMedusaAdminJsonResponse(response)
  return parseAdminUserPayload(payload) ?? FALLBACK_ADMIN_SESSION
}

type UseAdminSessionResult = {
  session: AdminSession
  isLoading: boolean
}

/** Resolved admin identity for sidebar account chrome — Medusa session or generic fallback. */
export function useAdminSession(): UseAdminSessionResult {
  const hasBackend = useMemo(() => resolveMedusaAdminBackendUrl() !== null, [])

  const { data, isLoading } = useQuery({
    queryKey: ["admin-session"],
    queryFn: fetchAdminSession,
    enabled: hasBackend,
    staleTime: 5 * 60 * 1000,
  })

  return {
    session: data ?? FALLBACK_ADMIN_SESSION,
    isLoading: hasBackend && isLoading,
  }
}
