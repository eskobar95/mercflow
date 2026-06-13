import crypto from "node:crypto"

import { MedusaError } from "@medusajs/utils"

import PaymentEncryptionService from "./encryption-service"

type MigrationConnection = {
  (table: string): {
    select: (...columns: string[]) => {
      where: (filter: Record<string, unknown>) => {
        whereNull: (column: string) => {
          limit: (count: number) => Promise<unknown[]>
        }
      }
      limit: (count: number) => Promise<unknown[]>
    }
    insert: (row: Record<string, unknown>) => Promise<unknown>
  }
}

const CONNECTOR_ENV_VAR_NAME = "MERCFLOW_CONNECTOR_ENCRYPTION_KEY"
const ALGORITHM = "aes-256-gcm"
const IV_LENGTH_BYTES = 12
const AUTH_TAG_LENGTH_BYTES = 16
const VERSION_PREFIX = "mf1:"

function decryptConnectorCredential(encoded: string): string {
  if (!encoded.startsWith(VERSION_PREFIX)) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Stored connector credentials have an unknown format or version prefix"
    )
  }

  const keyHex = process.env[CONNECTOR_ENV_VAR_NAME]?.trim()
  if (keyHex === undefined || keyHex === "") {
    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      `${CONNECTOR_ENV_VAR_NAME} must be set to migrate Stripe connector credentials`
    )
  }

  const key = Buffer.from(keyHex, "hex")
  const combined = Buffer.from(encoded.slice(VERSION_PREFIX.length), "base64")
  const iv = combined.subarray(0, IV_LENGTH_BYTES)
  const authTag = combined.subarray(
    IV_LENGTH_BYTES,
    IV_LENGTH_BYTES + AUTH_TAG_LENGTH_BYTES
  )
  const ciphertext = combined.subarray(IV_LENGTH_BYTES + AUTH_TAG_LENGTH_BYTES)

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH_BYTES,
  })
  decipher.setAuthTag(authTag)
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8")
}

type StripePlainCredentials = {
  secret_key: string
  publishable_key: string
  webhook_secret: string
}

function parseStripePlainCredentialsJson(jsonText: string): StripePlainCredentials {
  const parsed: unknown = JSON.parse(jsonText)
  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("Stripe connector credentials JSON is not an object")
  }
  const record = parsed as Record<string, unknown>
  return {
    secret_key: typeof record.secret_key === "string" ? record.secret_key : "",
    publishable_key: typeof record.publishable_key === "string" ? record.publishable_key : "",
    webhook_secret: typeof record.webhook_secret === "string" ? record.webhook_secret : "",
  }
}

function generatePaymentConfigId(): string {
  return `ppc_${crypto.randomBytes(16).toString("hex")}`
}

function resolveDefaultStoreId(rows: Array<{ id: string }>): string | null {
  const fromEnv = process.env.MERCFLOW_DEFAULT_STORE_ID?.trim()
  if (fromEnv !== undefined && fromEnv !== "") {
    return fromEnv
  }
  return rows[0]?.id ?? null
}

export type MigrateConnectorStripeCredentialsResult = {
  migrated: boolean
  storeId: string | null
  paymentConfigId: string | null
}

export async function migrateConnectorStripeCredentials(
  connection: MigrationConnection
): Promise<MigrateConnectorStripeCredentialsResult> {
  const stripeRows = await connection("connector_config")
    .select("id", "credentials_encrypted", "active", "vat_mode")
    .where({ type: "stripe" })
    .whereNull("deleted_at")
    .limit(1)

  const stripeRow = stripeRows[0] as
    | { id: string; credentials_encrypted: string }
    | undefined

  if (stripeRow === undefined) {
    return { migrated: false, storeId: null, paymentConfigId: null }
  }

  const storeRows = await connection("store").select("id").limit(1)
  const storeId = resolveDefaultStoreId(storeRows as Array<{ id: string }>)
  if (storeId === null) {
    return { migrated: false, storeId: null, paymentConfigId: null }
  }

  const existing = await connection("payment_provider_config")
    .select("id")
    .where({ store_id: storeId, provider: "stripe" })
    .whereNull("deleted_at")
    .limit(1)

  if (existing[0] !== undefined) {
    const row = existing[0] as { id: string }
    return { migrated: false, storeId, paymentConfigId: row.id }
  }

  const paymentEncryption = new PaymentEncryptionService()
  const plain = parseStripePlainCredentialsJson(
    decryptConnectorCredential(stripeRow.credentials_encrypted)
  )

  const secretKey = plain.secret_key.trim()
  const publishableKey = plain.publishable_key.trim()
  if (secretKey === "" || publishableKey === "") {
    return { migrated: false, storeId, paymentConfigId: null }
  }

  const mode = secretKey.startsWith("sk_live") ? "live" : "test"
  const paymentConfigId = generatePaymentConfigId()
  const now = new Date()

  const payload: Record<string, unknown> = {
    id: paymentConfigId,
    store_id: storeId,
    provider: "stripe",
    mode,
    created_at: now,
    updated_at: now,
    deleted_at: null,
  }

  if (mode === "live") {
    payload.live_secret_key = paymentEncryption.encrypt(secretKey)
    payload.live_publishable_key = publishableKey
    payload.live_webhook_secret =
      plain.webhook_secret.trim() !== "" ? plain.webhook_secret.trim() : null
  } else {
    payload.test_secret_key = paymentEncryption.encrypt(secretKey)
    payload.test_publishable_key = publishableKey
    payload.test_webhook_secret =
      plain.webhook_secret.trim() !== "" ? plain.webhook_secret.trim() : null
  }

  await connection("payment_provider_config").insert(payload)

  return { migrated: true, storeId, paymentConfigId }
}
