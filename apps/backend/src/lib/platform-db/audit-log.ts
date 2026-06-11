import { getPlatformDbPool } from "./platform-db"

export type PlatformAuditLogRow = {
  id: string
  operator_email: string
  action: string
  entity_type: string
  entity_id: string
  metadata: Record<string, unknown> | null
  created_at: string
}

type ListPlatformAuditLogInput = {
  limit: number
  offset: number
  from?: string
  to?: string
}

type ListPlatformAuditLogResult = {
  entries: PlatformAuditLogRow[]
  count: number
}

export async function listPlatformAuditLog(
  input: ListPlatformAuditLogInput,
): Promise<ListPlatformAuditLogResult> {
  const client = await getPlatformDbPool().connect()

  try {
    const params: string[] = []
    const filters: string[] = []

    if (input.from) {
      params.push(input.from)
      filters.push(`created_at >= $${params.length}`)
    }

    if (input.to) {
      params.push(input.to)
      filters.push(`created_at <= $${params.length}`)
    }

    const whereClause =
      filters.length > 0 ? `WHERE ${filters.join(" AND ")}` : ""

    const countResult = await client.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM platform_audit_log ${whereClause}`,
      params,
    )

    const limitParam = params.length + 1
    const offsetParam = params.length + 2
    const listParams = [...params, String(input.limit), String(input.offset)]

    const rows = await client.query<PlatformAuditLogRow>(
      `SELECT
         id,
         operator_email,
         action,
         entity_type,
         entity_id,
         metadata,
         created_at
       FROM platform_audit_log
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${limitParam}
       OFFSET $${offsetParam}`,
      listParams,
    )

    return {
      entries: rows.rows,
      count: Number(countResult.rows[0]?.count ?? 0),
    }
  } finally {
    client.release()
  }
}
