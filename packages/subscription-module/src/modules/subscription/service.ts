import type { Context } from "@medusajs/types"
import { MedusaService } from "@medusajs/framework/utils"
import { MedusaError } from "@medusajs/utils"

import {
  MercflowSubscription,
  MercflowSubscriptionConfig,
  MercflowSubscriptionRenewalLog,
} from "./models"
import { runWithTenantScope } from "./tenant-scope"
import type { MedusaContainer } from "@medusajs/framework/types"
import StripeSdk from "stripe"

import { ensureClubMembersCustomerGroup } from "./club-membership"
import { syncClubStripeProduct } from "./club-stripe-sync"
import type {
  CreateSubscriptionInput,
  PauseSubscriptionInput,
  SubscriptionConfigRecord,
  SubscriptionDetail,
  SubscriptionInterval,
  SubscriptionRecord,
  SubscriptionRenewalLogRecord,
  SubscriptionStatus,
  CompleteRenewalSuccessInput,
  RecordRenewalFailureInput,
  UpdateRenewalTimestampInput,
  UpsertSubscriptionConfigInput,
} from "./types"
import {
  RENEWAL_LOG_STATUSES,
  SUBSCRIPTION_INTERVALS,
  SUBSCRIPTION_STATUSES,
} from "./types"

function unwrapCreated<T>(result: T | T[]): T {
  return Array.isArray(result) ? result[0]! : result
}

function isSubscriptionInterval(value: string): value is SubscriptionInterval {
  return (SUBSCRIPTION_INTERVALS as readonly string[]).includes(value)
}

function isSubscriptionStatus(value: string): value is SubscriptionStatus {
  return (SUBSCRIPTION_STATUSES as readonly string[]).includes(value)
}

function isRenewalLogStatus(value: string): value is SubscriptionRenewalLogRecord["status"] {
  return (RENEWAL_LOG_STATUSES as readonly string[]).includes(value)
}


function toSubscriptionRecord(row: Record<string, unknown>): SubscriptionRecord {
  const interval = typeof row.interval === "string" ? row.interval : "monthly"
  const status = typeof row.status === "string" ? row.status : "active"
  if (!isSubscriptionInterval(interval)) {
    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      `Subscription "${String(row.id)}" has invalid interval "${interval}"`
    )
  }
  if (!isSubscriptionStatus(status)) {
    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      `Subscription "${String(row.id)}" has invalid status "${status}"`
    )
  }

  return {
    id: String(row.id),
    store_id: String(row.store_id),
    customer_id: String(row.customer_id),
    product_id: String(row.product_id),
    variant_id: String(row.variant_id),
    interval,
    status,
    stripe_subscription_id: (row.stripe_subscription_id as string | null | undefined) ?? null,
    current_period_start: row.current_period_start as string | Date,
    current_period_end: row.current_period_end as string | Date,
    next_renewal_at: row.next_renewal_at as string | Date,
    cancelled_at: (row.cancelled_at as string | Date | null | undefined) ?? null,
    pause_requested_at: (row.pause_requested_at as string | Date | null | undefined) ?? null,
    created_at: row.created_at as string | Date,
    updated_at: row.updated_at as string | Date,
    deleted_at: (row.deleted_at as string | Date | null | undefined) ?? null,
  }
}

function toSubscriptionConfigRecord(row: Record<string, unknown>): SubscriptionConfigRecord {
  return {
    id: String(row.id),
    store_id: String(row.store_id),
    club_enabled: Boolean(row.club_enabled),
    club_stripe_product_id:
      (row.club_stripe_product_id as string | null | undefined) ?? null,
    club_price_monthly: (row.club_price_monthly as string | number | null | undefined) ?? null,
    club_price_annual: (row.club_price_annual as string | number | null | undefined) ?? null,
    club_fallback_discount_pct:
      (row.club_fallback_discount_pct as string | number | null | undefined) ?? null,
    club_name: (row.club_name as string | null | undefined) ?? null,
    created_at: row.created_at as string | Date,
    updated_at: row.updated_at as string | Date,
    deleted_at: (row.deleted_at as string | Date | null | undefined) ?? null,
  }
}

function toRenewalLogRecord(row: Record<string, unknown>): SubscriptionRenewalLogRecord {
  const status = typeof row.status === "string" ? row.status : "success"
  if (!isRenewalLogStatus(status)) {
    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      `Renewal log "${String(row.id)}" has invalid status "${status}"`
    )
  }

  return {
    id: String(row.id),
    subscription_id: String(row.subscription_id),
    order_id: String(row.order_id),
    amount: row.amount as string | number,
    currency: String(row.currency),
    status,
    stripe_payment_intent_id:
      (row.stripe_payment_intent_id as string | null | undefined) ?? null,
    error_message: (row.error_message as string | null | undefined) ?? null,
    created_at: row.created_at as string | Date,
    updated_at: row.updated_at as string | Date,
    deleted_at: (row.deleted_at as string | Date | null | undefined) ?? null,
  }
}

export function advanceRenewalDate(
  from: Date,
  interval: SubscriptionInterval
): Date {
  const next = new Date(from.getTime())
  switch (interval) {
    case "weekly":
      next.setUTCDate(next.getUTCDate() + 7)
      return next
    case "biweekly":
      next.setUTCDate(next.getUTCDate() + 14)
      return next
    case "monthly":
      next.setUTCMonth(next.getUTCMonth() + 1)
      return next
    case "quarterly":
      next.setUTCMonth(next.getUTCMonth() + 3)
      return next
    default: {
      const _exhaustive: never = interval
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Unsupported interval "${String(_exhaustive)}"`
      )
    }
  }
}

class SubscriptionModuleService extends MedusaService({
  MercflowSubscription,
  MercflowSubscriptionRenewalLog,
  MercflowSubscriptionConfig,
}) {
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

  async getSubscriptionConfig(storeId: string): Promise<SubscriptionConfigRecord | null> {
    return this.withTenant(storeId, async (context) => {
      const rows = await this.listMercflowSubscriptionConfigs(
        { store_id: storeId },
        { take: 1 },
        context
      )
      const existing = rows[0] as Record<string, unknown> | undefined
      if (existing === undefined) {
        return null
      }
      return toSubscriptionConfigRecord(existing)
    })
  }

  async getOrCreateSubscriptionConfig(storeId: string): Promise<SubscriptionConfigRecord> {
    const existing = await this.getSubscriptionConfig(storeId)
    if (existing !== null) {
      return existing
    }

    return this.withTenant(storeId, async (context) => {
      const created = unwrapCreated(
        await this.createMercflowSubscriptionConfigs(
          {
            store_id: storeId,
            club_enabled: false,
            club_stripe_product_id: null,
            club_price_monthly: null,
            club_price_annual: null,
            club_fallback_discount_pct: null,
            club_name: null,
          },
          context
        )
      )
      return toSubscriptionConfigRecord(created as Record<string, unknown>)
    })
  }

  async upsertSubscriptionConfig(
    storeId: string,
    input: UpsertSubscriptionConfigInput,
    deps: {
      scope: MedusaContainer
      stripeSecretKey: string
    }
  ): Promise<SubscriptionConfigRecord> {
    const current = await this.getOrCreateSubscriptionConfig(storeId)

    if (input.club_enabled) {
      const clubName = input.club_name?.trim()
      const monthly = input.club_price_monthly
      const annual = input.club_price_annual

      if (clubName === undefined || clubName === "" || monthly === null || monthly === undefined || annual === null || annual === undefined) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "club_name, club_price_monthly, and club_price_annual are required when club is enabled"
        )
      }

      await ensureClubMembersCustomerGroup(deps.scope)

      const stripe = new StripeSdk(deps.stripeSecretKey)
      const productId = await syncClubStripeProduct(stripe, {
        storeId,
        clubName,
        monthlyAmountMajor: monthly,
        annualAmountMajor: annual,
        existingProductId: current.club_stripe_product_id,
      })

      return this.withTenant(storeId, async (context) => {
        const updated = unwrapCreated(
          await this.updateMercflowSubscriptionConfigs(
            { id: current.id, store_id: storeId },
            {
              club_enabled: true,
              club_name: clubName,
              club_price_monthly: monthly,
              club_price_annual: annual,
              club_fallback_discount_pct: input.club_fallback_discount_pct ?? null,
              club_stripe_product_id: productId,
            },
            context
          )
        )
        return toSubscriptionConfigRecord(updated as Record<string, unknown>)
      })
    }

    return this.withTenant(storeId, async (context) => {
      const updated = unwrapCreated(
        await this.updateMercflowSubscriptionConfigs(
          { id: current.id, store_id: storeId },
          {
            club_enabled: false,
            ...(input.club_name !== undefined ? { club_name: input.club_name } : {}),
            ...(input.club_price_monthly !== undefined
              ? { club_price_monthly: input.club_price_monthly }
              : {}),
            ...(input.club_price_annual !== undefined
              ? { club_price_annual: input.club_price_annual }
              : {}),
            ...(input.club_fallback_discount_pct !== undefined
              ? { club_fallback_discount_pct: input.club_fallback_discount_pct }
              : {}),
          },
          context
        )
      )
      return toSubscriptionConfigRecord(updated as Record<string, unknown>)
    })
  }

  private async requireSubscription(
    storeId: string,
    subscriptionId: string,
    context: Context
  ): Promise<SubscriptionRecord> {
    const rows = await this.listMercflowSubscriptions(
      {
        id: subscriptionId,
        store_id: storeId,
      },
      { take: 1 },
      context
    )
    const existing = rows[0] as Record<string, unknown> | undefined
    if (existing === undefined) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Subscription "${subscriptionId}" not found`
      )
    }
    return toSubscriptionRecord(existing)
  }

  async createSubscription(
    storeId: string,
    input: CreateSubscriptionInput
  ): Promise<SubscriptionRecord> {
    const status = input.status ?? "active"

    return this.withTenant(storeId, async (context) => {
      const created = unwrapCreated(
        await this.createMercflowSubscriptions(
          {
            store_id: storeId,
            customer_id: input.customer_id,
            product_id: input.product_id,
            variant_id: input.variant_id,
            interval: input.interval,
            status,
            stripe_subscription_id: input.stripe_subscription_id ?? null,
            current_period_start: input.current_period_start,
            current_period_end: input.current_period_end,
            next_renewal_at: input.next_renewal_at,
            cancelled_at: null,
            pause_requested_at: null,
          },
          context
        )
      )
      return toSubscriptionRecord(created as Record<string, unknown>)
    })
  }

  async listSubscriptions(
    storeId: string,
    filters?: {
      status?: SubscriptionStatus
      customer_id?: string
    },
    options?: { limit?: number; offset?: number }
  ): Promise<{ subscriptions: SubscriptionRecord[]; count: number }> {
    return this.withTenant(storeId, async (context) => {
      const where: Record<string, unknown> = { store_id: storeId }
      if (filters?.status !== undefined) {
        where.status = filters.status
      }
      if (filters?.customer_id !== undefined) {
        where.customer_id = filters.customer_id
      }

      const [rows, count] = await this.listAndCountMercflowSubscriptions(
        where,
        {
          order: { next_renewal_at: "ASC" },
          skip: options?.offset ?? 0,
          take: options?.limit ?? 50,
        },
        context
      )

      return {
        subscriptions: rows.map((row) =>
          toSubscriptionRecord(row as Record<string, unknown>)
        ),
        count,
      }
    })
  }

  async getSubscription(
    storeId: string,
    subscriptionId: string
  ): Promise<SubscriptionDetail> {
    return this.withTenant(storeId, async (context) => {
      const subscription = await this.requireSubscription(
        storeId,
        subscriptionId,
        context
      )

      const renewalRows = await this.listMercflowSubscriptionRenewalLogs(
        { subscription_id: subscriptionId },
        { order: { created_at: "DESC" } },
        context
      )

      return {
        subscription,
        renewal_logs: renewalRows.map((row) =>
          toRenewalLogRecord(row as Record<string, unknown>)
        ),
      }
    })
  }

  async pauseSubscription(
    storeId: string,
    subscriptionId: string,
    input?: PauseSubscriptionInput
  ): Promise<SubscriptionRecord> {
    return this.withTenant(storeId, async (context) => {
      const existing = await this.requireSubscription(
        storeId,
        subscriptionId,
        context
      )

      if (existing.status !== "active") {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Only active subscriptions can be paused (current status: ${existing.status})`
        )
      }

      const pauseRequestedAt =
        input?.pause_until !== undefined && input.pause_until !== null
          ? new Date(input.pause_until)
          : new Date()

      if (Number.isNaN(pauseRequestedAt.getTime())) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "pause_until must be a valid ISO date"
        )
      }

      const updated = unwrapCreated(
        await this.updateMercflowSubscriptions(
          { id: subscriptionId, store_id: storeId },
          {
            status: "paused",
            pause_requested_at: pauseRequestedAt,
          },
          context
        )
      )

      return toSubscriptionRecord(updated as Record<string, unknown>)
    })
  }

  async cancelSubscription(
    storeId: string,
    subscriptionId: string
  ): Promise<SubscriptionRecord> {
    return this.withTenant(storeId, async (context) => {
      const existing = await this.requireSubscription(
        storeId,
        subscriptionId,
        context
      )

      if (existing.status === "cancelled") {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Subscription is already cancelled"
        )
      }

      const now = new Date()
      const updated = unwrapCreated(
        await this.updateMercflowSubscriptions(
          { id: subscriptionId, store_id: storeId },
          {
            status: "cancelled",
            cancelled_at: now,
          },
          context
        )
      )

      return toSubscriptionRecord(updated as Record<string, unknown>)
    })
  }

  async resumeSubscription(
    storeId: string,
    subscriptionId: string
  ): Promise<SubscriptionRecord> {
    return this.withTenant(storeId, async (context) => {
      const existing = await this.requireSubscription(
        storeId,
        subscriptionId,
        context
      )

      if (existing.status !== "paused") {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Only paused subscriptions can be resumed (current status: ${existing.status})`
        )
      }

      const now = new Date()
      const nextRenewalAt = advanceRenewalDate(now, existing.interval)
      const periodEnd = advanceRenewalDate(now, existing.interval)

      const updated = unwrapCreated(
        await this.updateMercflowSubscriptions(
          { id: subscriptionId, store_id: storeId },
          {
            status: "active",
            pause_requested_at: null,
            current_period_start: now,
            current_period_end: periodEnd,
            next_renewal_at: nextRenewalAt,
          },
          context
        )
      )

      return toSubscriptionRecord(updated as Record<string, unknown>)
    })
  }

  async listDueRenewals(
    storeId: string,
    asOf: Date = new Date()
  ): Promise<SubscriptionRecord[]> {
    if (Number.isNaN(asOf.getTime())) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "asOf must be a valid date"
      )
    }

    return this.withTenant(storeId, async (context) => {
      const rows = await this.listMercflowSubscriptions(
        {
          store_id: storeId,
          status: "active",
          next_renewal_at: { $lte: asOf },
        },
        { order: { next_renewal_at: "ASC" } },
        context
      )

      return rows.map((row) => toSubscriptionRecord(row as Record<string, unknown>))
    })
  }

  async completeRenewalSuccess(
    storeId: string,
    subscriptionId: string,
    input: CompleteRenewalSuccessInput
  ): Promise<SubscriptionRecord> {
    if (Number.isNaN(input.renewed_at.getTime())) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "renewed_at must be a valid date"
      )
    }

    return this.withTenant(storeId, async (context) => {
      const existing = await this.requireSubscription(storeId, subscriptionId, context)
      const periodStart = input.renewed_at
      const periodEnd = advanceRenewalDate(periodStart, existing.interval)
      const nextRenewalAt = advanceRenewalDate(periodStart, existing.interval)

      const updated = unwrapCreated(
        await this.updateMercflowSubscriptions(
          { id: subscriptionId, store_id: storeId },
          {
            status: "active",
            current_period_start: periodStart,
            current_period_end: periodEnd,
            next_renewal_at: nextRenewalAt,
          },
          context
        )
      )

      await this.createMercflowSubscriptionRenewalLogs(
        {
          subscription_id: subscriptionId,
          order_id: input.order_id,
          amount: input.amount,
          currency: input.currency,
          status: "success",
          stripe_payment_intent_id: input.stripe_payment_intent_id,
          error_message: null,
        },
        context
      )

      return toSubscriptionRecord(updated as Record<string, unknown>)
    })
  }

  async recordRenewalFailure(
    storeId: string,
    subscriptionId: string,
    input: RecordRenewalFailureInput
  ): Promise<SubscriptionRecord> {
    return this.withTenant(storeId, async (context) => {
      await this.requireSubscription(storeId, subscriptionId, context)

      const updated = unwrapCreated(
        await this.updateMercflowSubscriptions(
          { id: subscriptionId, store_id: storeId },
          { status: "past_due" },
          context
        )
      )

      await this.createMercflowSubscriptionRenewalLogs(
        {
          subscription_id: subscriptionId,
          order_id: input.order_id,
          amount: input.amount,
          currency: input.currency,
          status: "failed",
          stripe_payment_intent_id: input.stripe_payment_intent_id ?? null,
          error_message: input.error_message,
        },
        context
      )

      return toSubscriptionRecord(updated as Record<string, unknown>)
    })
  }

  async updateRenewalTimestamp(
    storeId: string,
    subscriptionId: string,
    input: UpdateRenewalTimestampInput
  ): Promise<SubscriptionRecord> {
    if (Number.isNaN(input.next_renewal_at.getTime())) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "next_renewal_at must be a valid date"
      )
    }

    return this.withTenant(storeId, async (context) => {
      await this.requireSubscription(storeId, subscriptionId, context)

      const patch: Record<string, unknown> = {
        next_renewal_at: input.next_renewal_at,
      }
      if (input.current_period_start !== undefined) {
        patch.current_period_start = input.current_period_start
      }
      if (input.current_period_end !== undefined) {
        patch.current_period_end = input.current_period_end
      }

      const updated = unwrapCreated(
        await this.updateMercflowSubscriptions(
          { id: subscriptionId, store_id: storeId },
          patch,
          context
        )
      )

      return toSubscriptionRecord(updated as Record<string, unknown>)
    })
  }
}

export default SubscriptionModuleService

export { toSubscriptionRecord, toRenewalLogRecord, toSubscriptionConfigRecord }
export { toIso } from "./iso"
