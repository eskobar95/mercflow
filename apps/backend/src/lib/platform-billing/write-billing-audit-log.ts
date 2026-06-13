import { randomUUID } from "node:crypto"

import { getPlatformDbPool, isPlatformDbConfigured } from "../platform-db/platform-db"

export async function writeBillingAuditLog(input: {
  action: string
  entity_id: string
  metadata?: Record<string, unknown> | null
}): Promise<void> {
  if (!isPlatformDbConfigured()) {
    return
  }

  const client = await getPlatformDbPool().connect()

  try {
    await client.query(
      `INSERT INTO platform_audit_log (
         id,
         operator_email,
         action,
         entity_type,
         entity_id,
         metadata,
         created_at,
         updated_at
       ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
      [
        randomUUID(),
        "stripe-platform-webhook@system",
        input.action,
        "tenant",
        input.entity_id,
        input.metadata ?? null,
      ],
    )
  } finally {
    client.release()
  }
}
