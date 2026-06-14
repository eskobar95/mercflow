import type { ConnectorAppStatus } from "@/features/connectors/types"
import type { ShipmondoConnectorGetDto } from "@/features/connectors/shipmondoTypes"

const VERIFICATION_WINDOW_MS = 24 * 60 * 60 * 1000

export function resolveShipmondoConnectorAppStatus(
  snapshot: ShipmondoConnectorGetDto | null | undefined,
  now: Date = new Date(),
): ConnectorAppStatus {
  if (!snapshot?.credentials.apiUserConfigured || !snapshot.credentials.apiKeyConfigured) return "not_configured"
  const latest = snapshot.recentLogs[0]
  if (latest && !latest.success) return "error"
  if (snapshot.lastTestedAt && latest?.success) {
    const testedAt = new Date(snapshot.lastTestedAt)
    if (!Number.isNaN(testedAt.getTime()) && now.getTime() - testedAt.getTime() <= VERIFICATION_WINDOW_MS) return "connected"
  }
  return "not_configured"
}
