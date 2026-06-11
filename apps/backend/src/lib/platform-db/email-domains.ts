import { getPlatformDbPool } from "./platform-db"

export type PlatformEmailDomainRow = {
  store_id: string
  domain: string | null
  from_email: string | null
  ses_domain_status: string
  ses_identity_arn: string | null
  updated_at: string
}

export async function listPlatformEmailDomains(): Promise<PlatformEmailDomainRow[]> {
  const client = await getPlatformDbPool().connect()

  try {
    const result = await client.query<PlatformEmailDomainRow>(
      `SELECT
         store_id,
         domain,
         from_email,
         ses_domain_status,
         ses_identity_arn,
         updated_at
       FROM email_configs
       WHERE deleted_at IS NULL
       ORDER BY store_id ASC`,
    )

    return result.rows
  } finally {
    client.release()
  }
}
