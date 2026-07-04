import type { Context } from "@medusajs/types"
import { MedusaService } from "@medusajs/framework/utils"
import { MedusaError } from "@medusajs/utils"

import { MercflowEmailConfig, MercflowEmailDelivery } from "./models"
import {
  buildEmailJobId,
  createBullMQNotificationQueueClient,
  type NotificationQueueClient,
} from "./queue-client"
import {
  createSESClientFromEnv,
  type ISESClient,
} from "./ses-client"
import { runWithTenantScope } from "./tenant-scope"
import type {
  DomainDnsRecords,
  DomainStatusResult,
  EmailConfigRecord,
  EmailDeliveryRecord,
  EmailDeliveryStatus,
  EnqueueEmailInput,
  EnqueueEmailResult,
  SesDomainStatus,
  SetupDomainResult,
  UpdateEmailConfigBrandingInput,
} from "./types"
import { DEFAULT_FALLBACK_FROM, SES_DOMAIN_STATUSES } from "./types"

function isSesDomainStatus(value: string): value is SesDomainStatus {
  return (SES_DOMAIN_STATUSES as readonly string[]).includes(value)
}

function isEmailDeliveryStatus(value: string): value is EmailDeliveryStatus {
  return (["queued", "sent", "failed", "dead_letter"] as const).includes(
    value as EmailDeliveryStatus
  )
}

function unwrapCreated<T>(result: T | T[]): T {
  return Array.isArray(result) ? result[0]! : result
}

function parseDnsRecords(value: unknown): DomainDnsRecords | null {
  if (value === null || value === undefined) {
    return null
  }
  if (typeof value !== "object") {
    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      "email_configs.dns_records must be an object when present"
    )
  }
  const record = value as Record<string, unknown>
  const dkim = record.dkim
  const spf = record.spf
  if (!Array.isArray(dkim) || typeof spf !== "object" || spf === null) {
    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      "email_configs.dns_records has invalid shape"
    )
  }
  return value as DomainDnsRecords
}

function toEmailConfigRecord(row: Record<string, unknown>): EmailConfigRecord {
  const sesDomainStatus =
    typeof row.ses_domain_status === "string" ? row.ses_domain_status : "pending"
  if (!isSesDomainStatus(sesDomainStatus)) {
    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      `Email config "${String(row.id)}" has invalid ses_domain_status "${sesDomainStatus}"`
    )
  }

  return {
    id: String(row.id),
    store_id: String(row.store_id),
    domain: (row.domain as string | null | undefined) ?? null,
    from_email: (row.from_email as string | null | undefined) ?? null,
    from_name: (row.from_name as string | null | undefined) ?? null,
    reply_to: (row.reply_to as string | null | undefined) ?? null,
    logo_url: (row.logo_url as string | null | undefined) ?? null,
    brand_color: (row.brand_color as string | null | undefined) ?? null,
    support_email: (row.support_email as string | null | undefined) ?? null,
    ses_domain_status: sesDomainStatus,
    ses_identity_arn: (row.ses_identity_arn as string | null | undefined) ?? null,
    fallback_from: (row.fallback_from as string | null | undefined) ?? null,
    dns_records: parseDnsRecords(row.dns_records),
    created_at: row.created_at as string | Date,
    updated_at: row.updated_at as string | Date,
    deleted_at: (row.deleted_at as string | Date | null | undefined) ?? null,
  }
}

function toEmailDeliveryRecord(row: Record<string, unknown>): EmailDeliveryRecord {
  const status = typeof row.status === "string" ? row.status : "queued"
  if (!isEmailDeliveryStatus(status)) {
    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      `Email delivery "${String(row.id)}" has invalid status "${status}"`
    )
  }

  return {
    id: String(row.id),
    store_id: String(row.store_id),
    template_key: String(row.template_key),
    to_email: String(row.to_email),
    entity_id: String(row.entity_id),
    idempotency_key: String(row.idempotency_key),
    status,
    error_message: (row.error_message as string | null | undefined) ?? null,
    sent_at: (row.sent_at as string | Date | null | undefined) ?? null,
    ses_message_id: (row.ses_message_id as string | null | undefined) ?? null,
    created_at: row.created_at as string | Date,
    updated_at: row.updated_at as string | Date,
    deleted_at: (row.deleted_at as string | Date | null | undefined) ?? null,
  }
}

class NotificationModuleService extends MedusaService({
  MercflowEmailConfig,
  MercflowEmailDelivery,
}) {
  private queueClient_: NotificationQueueClient | null = null
  private sesClient_: ISESClient | null = null

  setQueueClient(client: NotificationQueueClient): void {
    this.queueClient_ = client
  }

  setSESClient(client: ISESClient): void {
    this.sesClient_ = client
  }

  private getSESClient(): ISESClient {
    if (this.sesClient_ === null) {
      this.sesClient_ = createSESClientFromEnv()
    }
    return this.sesClient_
  }

  private getQueueClient(): NotificationQueueClient {
    if (this.queueClient_ === null) {
      this.queueClient_ = createBullMQNotificationQueueClient()
    }
    return this.queueClient_
  }

  async withTenant<T>(
    storeId: string,
    fn: (context: Context) => Promise<T>
  ): Promise<T> {
    const baseRepo = (
      this as unknown as {
        baseRepository_: Parameters<typeof runWithTenantScope>[0]
      }
    ).baseRepository_
    return runWithTenantScope(baseRepo, storeId, fn)
  }

  async getEmailConfig(storeId: string): Promise<EmailConfigRecord> {
    return this.withTenant(storeId, async (context) => {
      const rows = await this.listMercflowEmailConfigs(
        { store_id: storeId },
        { take: 1 },
        context
      )
      const existing = rows[0]
      if (existing !== undefined) {
        return toEmailConfigRecord(existing as Record<string, unknown>)
      }

      const created = unwrapCreated(
        await this.createMercflowEmailConfigs(
          {
            store_id: storeId,
            fallback_from: DEFAULT_FALLBACK_FROM,
            ses_domain_status: "pending",
          },
          context
        )
      )
      return toEmailConfigRecord(created as Record<string, unknown>)
    })
  }

  async updateEmailConfig(
    storeId: string,
    input: UpdateEmailConfigBrandingInput
  ): Promise<EmailConfigRecord> {
    return this.withTenant(storeId, async (context) => {
      const rows = await this.listMercflowEmailConfigs(
        { store_id: storeId },
        { take: 1 },
        context
      )
      let current =
        rows[0] !== undefined
          ? toEmailConfigRecord(rows[0] as Record<string, unknown>)
          : null

      if (current === null) {
        const created = unwrapCreated(
          await this.createMercflowEmailConfigs(
            {
              store_id: storeId,
              fallback_from: DEFAULT_FALLBACK_FROM,
              ses_domain_status: "pending",
            },
            context
          )
        )
        current = toEmailConfigRecord(created as Record<string, unknown>)
      }

      const payload: Record<string, unknown> = {}

      if (input.logo_url !== undefined) payload.logo_url = input.logo_url
      if (input.brand_color !== undefined) payload.brand_color = input.brand_color
      if (input.from_name !== undefined) payload.from_name = input.from_name
      if (input.reply_to !== undefined) payload.reply_to = input.reply_to
      if (input.support_email !== undefined) payload.support_email = input.support_email

      if (Object.keys(payload).length === 0) {
        return current
      }

      const updated = unwrapCreated(
        await this.updateMercflowEmailConfigs({ id: current.id, ...payload }, context)
      )
      return toEmailConfigRecord(updated as Record<string, unknown>)
    })
  }

  async setupDomain(storeId: string, domain: string): Promise<SetupDomainResult> {
    const normalizedDomain = domain.trim().toLowerCase()
    if (normalizedDomain === "") {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "domain is required")
    }

    const sesClient = this.getSESClient()
    const identity = await sesClient.createEmailIdentity(normalizedDomain)

    const config = await this.withTenant(storeId, async (context) => {
      const rows = await this.listMercflowEmailConfigs(
        { store_id: storeId },
        { take: 1 },
        context
      )
      const fallbackFrom = DEFAULT_FALLBACK_FROM
      const payload = {
        domain: normalizedDomain,
        ses_identity_arn: identity.identityArn,
        dns_records: identity.records,
        ses_domain_status: "pending" as const,
        from_email: `noreply@${normalizedDomain}`,
        fallback_from: fallbackFrom,
      }

      if (rows[0] !== undefined) {
        const current = toEmailConfigRecord(rows[0] as Record<string, unknown>)
        const updated = unwrapCreated(
          await this.updateMercflowEmailConfigs({ id: current.id, ...payload }, context)
        )
        return toEmailConfigRecord(updated as Record<string, unknown>)
      }

      const created = unwrapCreated(
        await this.createMercflowEmailConfigs(
          {
            store_id: storeId,
            ...payload,
          },
          context
        )
      )
      return toEmailConfigRecord(created as Record<string, unknown>)
    })

    return {
      domain: config.domain ?? normalizedDomain,
      records: identity.records,
      ses_domain_status: config.ses_domain_status,
      fallback_from: config.fallback_from ?? DEFAULT_FALLBACK_FROM,
    }
  }

  async checkDomainStatus(storeId: string): Promise<DomainStatusResult> {
    const config = await this.getEmailConfig(storeId)
    if (config.domain === null || config.domain.trim() === "") {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "No sending domain configured for this store"
      )
    }

    const sesClient = this.getSESClient()
    const identity = await sesClient.getEmailIdentity(config.domain)
    const fallbackFrom = config.fallback_from ?? DEFAULT_FALLBACK_FROM

    const updated = await this.withTenant(storeId, async (context) => {
      const payload: Record<string, unknown> = {
        ses_domain_status: identity.verificationStatus,
        dns_records: identity.records,
      }
      if (identity.verificationStatus === "verified") {
        payload.from_email = `noreply@${config.domain}`
      }

      const result = unwrapCreated(
        await this.updateMercflowEmailConfigs({ id: config.id, ...payload }, context)
      )
      return toEmailConfigRecord(result as Record<string, unknown>)
    })

    return {
      status: updated.ses_domain_status,
      records: updated.dns_records,
      fallback_from: fallbackFrom,
    }
  }

  async checkAllPendingDomainStatuses(
    storeIds: readonly string[]
  ): Promise<{ checked: number; updated: number }> {
    let checked = 0
    let updated = 0

    for (const storeId of storeIds) {
      const config = await this.withTenant(storeId, async (context) => {
        const rows = await this.listMercflowEmailConfigs(
          { store_id: storeId },
          { take: 1 },
          context
        )
        return rows[0] !== undefined
          ? toEmailConfigRecord(rows[0] as Record<string, unknown>)
          : null
      })

      if (config === null || config.domain === null || config.ses_domain_status !== "pending") {
        continue
      }

      checked += 1
      const beforeStatus = config.ses_domain_status
      const result = await this.checkDomainStatus(storeId)
      if (result.status !== beforeStatus) {
        updated += 1
      }
    }

    return { checked, updated }
  }

  __hooks = {
    onApplicationStart: async (): Promise<void> => {
      if (process.env.NOTIFICATION_DOMAIN_POLLING === "false") {
        return
      }
      const workerMode = process.env.MEDUSA_WORKER_MODE
      if (workerMode === "server") {
        return
      }
      await this.getQueueClient().scheduleDomainStatusPolling()
    },
  }

  async enqueueEmail(input: EnqueueEmailInput): Promise<EnqueueEmailResult> {
    const { storeId, templateKey, to, entityId, data } = input
    const idempotencyKey = buildEmailJobId(storeId, templateKey, entityId)
    const queueClient = this.getQueueClient()

    const existingJob = await queueClient.getJob(idempotencyKey)
    if (existingJob !== null) {
      const existingDelivery = await this.withTenant(storeId, async (context) => {
        const rows = await this.listMercflowEmailDeliveries(
          { idempotency_key: idempotencyKey, store_id: storeId },
          { take: 1 },
          context
        )
        return rows[0] !== undefined
          ? toEmailDeliveryRecord(rows[0] as Record<string, unknown>)
          : null
      })

      if (existingDelivery !== null) {
        return { delivery: existingDelivery, enqueued: false }
      }

      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `BullMQ job ${idempotencyKey} exists without a matching email delivery record`
      )
    }

    return this.withTenant(storeId, async (context) => {
      const existingRows = await this.listMercflowEmailDeliveries(
        { idempotency_key: idempotencyKey, store_id: storeId },
        { take: 1 },
        context
      )
      if (existingRows[0] !== undefined) {
        return {
          delivery: toEmailDeliveryRecord(existingRows[0] as Record<string, unknown>),
          enqueued: false,
        }
      }

      const created = unwrapCreated(
        await this.createMercflowEmailDeliveries(
          {
            store_id: storeId,
            template_key: templateKey,
            to_email: to,
            entity_id: entityId,
            idempotency_key: idempotencyKey,
            status: "queued",
          },
          context
        )
      )
      const delivery = toEmailDeliveryRecord(created as Record<string, unknown>)

      const jobAfterCreate = await queueClient.getJob(idempotencyKey)
      if (jobAfterCreate !== null) {
        return { delivery, enqueued: false }
      }

      await queueClient.addSendEmailJob(idempotencyKey, {
        storeId,
        templateKey,
        to,
        entityId,
        data,
        deliveryId: delivery.id,
      })

      return { delivery, enqueued: true }
    })
  }

  async listDeliveries(
    storeId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<{ deliveries: EmailDeliveryRecord[]; count: number }> {
    return this.withTenant(storeId, async (context) => {
      const limit = options?.limit ?? 50
      const offset = options?.offset ?? 0
      const [rows, count] = await this.listAndCountMercflowEmailDeliveries(
        { store_id: storeId },
        {
          take: limit,
          skip: offset,
          order: { created_at: "DESC" },
        },
        context
      )

      return {
        deliveries: rows.map((row) => toEmailDeliveryRecord(row as Record<string, unknown>)),
        count,
      }
    })
  }

  async markDeliverySent(
    storeId: string,
    deliveryId: string,
    sesMessageId: string
  ): Promise<void> {
    await this.withTenant(storeId, async (context) => {
      await this.updateMercflowEmailDeliveries(
        {
          id: deliveryId,
          store_id: storeId,
          status: "sent",
          ses_message_id: sesMessageId,
          sent_at: new Date(),
          error_message: null,
        },
        context
      )
    })
  }

  async markDeliveryFailed(
    storeId: string,
    deliveryId: string,
    errorMessage: string
  ): Promise<void> {
    await this.withTenant(storeId, async (context) => {
      await this.updateMercflowEmailDeliveries(
        {
          id: deliveryId,
          store_id: storeId,
          status: "failed",
          error_message: errorMessage,
        },
        context
      )
    })
  }

  async markDeliveryDeadLetter(
    storeId: string,
    deliveryId: string,
    errorMessage: string
  ): Promise<void> {
    await this.withTenant(storeId, async (context) => {
      await this.updateMercflowEmailDeliveries(
        {
          id: deliveryId,
          store_id: storeId,
          status: "dead_letter",
          error_message: errorMessage,
        },
        context
      )
    })
  }

  async resendEmail(deliveryId: string, storeId: string): Promise<EnqueueEmailResult> {
    return this.withTenant(storeId, async (context) => {
      const rows = await this.listMercflowEmailDeliveries(
        { id: deliveryId, store_id: storeId },
        { take: 1 },
        context
      )
      const original = rows[0]
      if (original === undefined) {
        throw new MedusaError(
          MedusaError.Types.NOT_FOUND,
          `Email delivery ${deliveryId} not found for store ${storeId}`
        )
      }

      const record = toEmailDeliveryRecord(original as Record<string, unknown>)
      const resendKey = `${record.idempotency_key}:resend:${Date.now()}`

      const created = unwrapCreated(
        await this.createMercflowEmailDeliveries(
          {
            store_id: storeId,
            template_key: record.template_key,
            to_email: record.to_email,
            entity_id: record.entity_id,
            idempotency_key: resendKey,
            status: "queued",
          },
          context
        )
      )
      const delivery = toEmailDeliveryRecord(created as Record<string, unknown>)
      const queueClient = this.getQueueClient()

      await queueClient.addSendEmailJob(resendKey, {
        storeId,
        templateKey: record.template_key,
        to: record.to_email,
        entityId: record.entity_id,
        data: {},
        deliveryId: delivery.id,
      })

      return { delivery, enqueued: true }
    })
  }
}

export default NotificationModuleService
