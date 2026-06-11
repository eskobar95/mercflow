import { getPlatformDbPool } from "./platform-db"

export type PlatformEmailDeliveryRow = {
  id: string
  store_id: string
  template_key: string
  to_email: string
  entity_id: string
  status: string
  error_message: string | null
  sent_at: string | null
  ses_message_id: string | null
  created_at: string
}

type ListPlatformEmailDeliveriesInput = {
  query?: string
  limit: number
  offset: number
}

type ListPlatformEmailDeliveriesResult = {
  deliveries: PlatformEmailDeliveryRow[]
  count: number
}

export async function listPlatformEmailDeliveries(
  input: ListPlatformEmailDeliveriesInput,
): Promise<ListPlatformEmailDeliveriesResult> {
  const client = await getPlatformDbPool().connect()

  try {
    const params: string[] = []
    const filters: string[] = ["deleted_at IS NULL"]

    if (input.query) {
      const pattern = `%${input.query.replace(/[%_\\]/g, "\\$&")}%`
      params.push(pattern, pattern)
      const emailIndex = params.length - 1
      const entityIndex = params.length
      filters.push(
        `(to_email ILIKE $${emailIndex} ESCAPE '\\' OR entity_id ILIKE $${entityIndex} ESCAPE '\\')`,
      )
    }

    const whereClause = filters.length > 0 ? `WHERE ${filters.join(" AND ")}` : ""

    const countResult = await client.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM email_deliveries ${whereClause}`,
      params,
    )

    const limitParam = params.length + 1
    const offsetParam = params.length + 2
    const listParams = [...params, String(input.limit), String(input.offset)]

    const rows = await client.query<PlatformEmailDeliveryRow>(
      `SELECT
         id,
         store_id,
         template_key,
         to_email,
         entity_id,
         status,
         error_message,
         sent_at,
         ses_message_id,
         created_at
       FROM email_deliveries
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${limitParam}
       OFFSET $${offsetParam}`,
      listParams,
    )

    return {
      deliveries: rows.rows,
      count: Number(countResult.rows[0]?.count ?? 0),
    }
  } finally {
    client.release()
  }
}
