import { model } from "@medusajs/framework/utils"

export const PlatformAuditLog = model.define("platform_audit_log", {
  id: model.id().primaryKey(),
  operator_email: model.text(),
  action: model.text(),
  entity_type: model.text(),
  entity_id: model.text(),
  metadata: model.json().nullable(),
})
