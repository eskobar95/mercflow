import { MedusaService } from "@medusajs/framework/utils"

import { PlatformAuditLog } from "./models/platform-audit-log"

export type CreatePlatformAuditLogInput = {
  operator_email: string
  action: string
  entity_type: string
  entity_id: string
  metadata?: Record<string, unknown> | null
}

class PlatformModuleService extends MedusaService({
  PlatformAuditLog,
}) {
  async createAuditLogEntry(
    input: CreatePlatformAuditLogInput,
  ): Promise<Record<string, unknown>> {
    const [entry] = await this.createPlatformAuditLogs([
      {
        operator_email: input.operator_email,
        action: input.action,
        entity_type: input.entity_type,
        entity_id: input.entity_id,
        metadata: input.metadata ?? null,
      },
    ])

    return entry as Record<string, unknown>
  }
}

export default PlatformModuleService
