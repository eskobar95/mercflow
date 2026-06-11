import type { Job } from "bullmq"
import { createElement, type FC } from "react"
import { describe, expect, it, vi } from "vitest"

import type { ISESClient } from "@mercflow/notification-module/ses-client"
import type { EmailConfigRecord, SendEmailJobPayload, TemplateProps } from "@mercflow/notification-module/types"
import { NOTIFICATION_JOB_RETRY_OPTIONS } from "@mercflow/notification-module/types"
import {
  buildTemplateProps,
  createSendEmailProcessor,
  formatFromAddress,
  getNotificationWorkerConcurrency,
  isFinalJobFailure,
  renderTemplate,
  resolveEmailSubject,
  resolveFromEmail,
} from "../src/workers/notification-worker"

const STORE_ID = "store_01KG0VBTT0714XV2CCTEBRVC47"

function buildEmailConfig(overrides?: Partial<EmailConfigRecord>): EmailConfigRecord {
  return {
    id: "ecfg_01ABC",
    store_id: STORE_ID,
    domain: "shop.example.com",
    from_email: "noreply@shop.example.com",
    from_name: "Example Shop",
    reply_to: "support@shop.example.com",
    logo_url: "https://cdn.example.com/logo.png",
    brand_color: "#112233",
    support_email: "support@shop.example.com",
    ses_domain_status: "pending",
    ses_identity_arn: null,
    fallback_from: "noreply@mail.mercflow.com",
    dns_records: null,
    created_at: new Date("2026-06-11T12:00:00.000Z"),
    updated_at: new Date("2026-06-11T12:00:00.000Z"),
    deleted_at: null,
    ...overrides,
  }
}

function buildJob(
  overrides?: Partial<SendEmailJobPayload> & { name?: string }
): Job<SendEmailJobPayload> {
  const payload: SendEmailJobPayload = {
    storeId: STORE_ID,
    templateKey: "order-confirmation",
    to: "buyer@example.com",
    entityId: "order_01XYZ",
    data: { orderNumber: "1001" },
    deliveryId: "edel_01ABC",
    ...overrides,
  }

  return {
    name: overrides?.name ?? "send-email",
    data: payload,
    opts: { attempts: NOTIFICATION_JOB_RETRY_OPTIONS.attempts },
    attemptsMade: 0,
    id: "job_01",
  } as Job<SendEmailJobPayload>
}

const TestTemplate: FC<TemplateProps & { headline?: string }> = ({ headline }) =>
  createElement("div", null, headline ?? "MercFlow")

function buildSesClientMock(sendEmail: ISESClient["sendEmail"]): ISESClient {
  return {
    sendEmail,
    createEmailIdentity: vi.fn(),
    getEmailIdentity: vi.fn(),
  }
}

describe("notification worker helpers", (): void => {
  it("uses verified from_email when domain is verified", (): void => {
    const from = resolveFromEmail(
      buildEmailConfig({
        ses_domain_status: "verified",
        from_email: "noreply@shop.example.com",
        fallback_from: "noreply@mail.mercflow.com",
      })
    )

    expect(from).toBe("noreply@shop.example.com")
  })

  it("uses fallback_from when domain is not verified", (): void => {
    const from = resolveFromEmail(
      buildEmailConfig({
        ses_domain_status: "pending",
        from_email: "noreply@shop.example.com",
        fallback_from: "noreply@mail.mercflow.com",
      })
    )

    expect(from).toBe("noreply@mail.mercflow.com")
  })

  it("formats from address with display name", (): void => {
    expect(formatFromAddress("noreply@shop.example.com", "Example Shop")).toBe(
      "Example Shop <noreply@shop.example.com>"
    )
  })

  it("derives a readable subject from template key", (): void => {
    expect(resolveEmailSubject("order-confirmation")).toBe("Order Confirmation")
  })

  it("merges email config branding into template props", (): void => {
    const props = buildTemplateProps(buildEmailConfig(), { orderNumber: "1001" })

    expect(props.logoUrl).toBe("https://cdn.example.com/logo.png")
    expect(props.orderNumber).toBe("1001")
  })

  it("defaults worker concurrency to 5", (): void => {
    const previous = process.env.NOTIFICATION_WORKER_CONCURRENCY
    delete process.env.NOTIFICATION_WORKER_CONCURRENCY

    expect(getNotificationWorkerConcurrency()).toBe(5)

    process.env.NOTIFICATION_WORKER_CONCURRENCY = previous
  })

  it("reads worker concurrency from env", (): void => {
    const previous = process.env.NOTIFICATION_WORKER_CONCURRENCY
    process.env.NOTIFICATION_WORKER_CONCURRENCY = "8"

    expect(getNotificationWorkerConcurrency()).toBe(8)

    process.env.NOTIFICATION_WORKER_CONCURRENCY = previous
  })

  it("detects final BullMQ failure after retry budget is exhausted", (): void => {
    expect(isFinalJobFailure(3, 3)).toBe(true)
    expect(isFinalJobFailure(2, 3)).toBe(false)
  })

  it("throws when template registry has no entry", async (): Promise<void> => {
    await expect(renderTemplate("missing-template", {}, new Map())).rejects.toThrow(
      'Unknown email template "missing-template"'
    )
  })

  it("renders registered React Email templates to HTML", async (): Promise<void> => {
    const registry = new Map<string, FC<TemplateProps>>()
    registry.set("order-confirmation", TestTemplate)

    const html = await renderTemplate(
      "order-confirmation",
      { headline: "Thanks for your order" },
      registry
    )

    expect(html).toContain("Thanks for your order")
  })
})

describe("createSendEmailProcessor", (): void => {
  it("marks delivery sent after SES succeeds", async (): Promise<void> => {
    const registry = new Map<string, FC<TemplateProps>>()
    registry.set("order-confirmation", TestTemplate)

    const markDeliverySent = vi.fn().mockResolvedValue(undefined)
    const markDeliveryFailed = vi.fn().mockResolvedValue(undefined)

    const processor = createSendEmailProcessor({
      getEmailConfig: vi.fn().mockResolvedValue(buildEmailConfig()),
      markDeliverySent,
      markDeliveryFailed,
      markDeliveryDeadLetter: vi.fn(),
      sesClient: buildSesClientMock(
        vi.fn().mockResolvedValue({ messageId: "ses-msg-123" })
      ),
      templateRegistry: registry,
    })

    await processor(buildJob())

    expect(markDeliverySent).toHaveBeenCalledWith(STORE_ID, "edel_01ABC", "ses-msg-123")
    expect(markDeliveryFailed).not.toHaveBeenCalled()
  })

  it("marks delivery failed and rethrows for BullMQ retry", async (): Promise<void> => {
    const registry = new Map<string, FC<TemplateProps>>()
    registry.set("order-confirmation", TestTemplate)

    const markDeliverySent = vi.fn()
    const markDeliveryFailed = vi.fn().mockResolvedValue(undefined)

    const processor = createSendEmailProcessor({
      getEmailConfig: vi.fn().mockResolvedValue(buildEmailConfig()),
      markDeliverySent,
      markDeliveryFailed,
      markDeliveryDeadLetter: vi.fn(),
      sesClient: buildSesClientMock(
        vi.fn().mockRejectedValue(new Error("SES unavailable"))
      ),
      templateRegistry: registry,
    })

    await expect(processor(buildJob())).rejects.toThrow("SES unavailable")
    expect(markDeliveryFailed).toHaveBeenCalledWith(STORE_ID, "edel_01ABC", "SES unavailable")
    expect(markDeliverySent).not.toHaveBeenCalled()
  })

  it("uses configured retry attempts for final failure detection", (): void => {
    const maxAttempts = NOTIFICATION_JOB_RETRY_OPTIONS.attempts
    expect(maxAttempts).toBe(3)
    expect(NOTIFICATION_JOB_RETRY_OPTIONS.backoff).toEqual({
      type: "exponential",
      delay: 30_000,
    })
    expect(isFinalJobFailure(maxAttempts, maxAttempts)).toBe(true)
  })
})
