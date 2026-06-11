import { PLATFORM_MODULE } from "../../modules/platform"
import type PlatformModuleService from "../../modules/platform/service"

export async function writePlatformAuditLog(
  scope: { resolve: (key: string) => unknown },
  input: {
    operator_email: string
    action: string
    entity_type: string
    entity_id: string
    metadata?: Record<string, unknown> | null
  },
): Promise<void> {
  const platformService = scope.resolve(PLATFORM_MODULE) as PlatformModuleService
  await platformService.createAuditLogEntry(input)
}
