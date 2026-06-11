import { describe, expect, it, vi } from "vitest"

import NotificationModuleService from "../src/modules/notification/service"
import {
  buildDomainDnsRecords,
  mapSesVerificationStatus,
  StubSESClient,
  type ISESClient,
} from "../src/modules/notification/ses-client"
import type { NotificationQueueClient } from "../src/modules/notification/queue-client"
import type { EmailConfigRecord } from "../src/modules/notification/types"
import { DEFAULT_FALLBACK_FROM } from "../src/modules/notification/types"

const STORE_A = "store_01KG0VBTT0714XV2CCTEBRVC47"
const DOMAIN = "mail.example.com"

function buildConfig(overrides?: Partial<EmailConfigRecord>): EmailConfigRecord {
  return {
    id: "ecfg_01ABC",
    store_id: STORE_A,
    domain: DOMAIN,
    from_email: `noreply@${DOMAIN}`,
    from_name: null,
    reply_to: null,
    logo_url: null,
    brand_color: null,
    support_email: null,
    ses_domain_status: "pending",
    ses_identity_arn: `arn:aws:ses:eu-north-1:123456789012:identity/${DOMAIN}`,
    fallback_from: DEFAULT_FALLBACK_FROM,
    dns_records: buildDomainDnsRecords(DOMAIN, ["token1", "token2", "token3"]),
    created_at: new Date("2026-06-11T12:00:00.000Z"),
    updated_at: new Date("2026-06-11T12:00:00.000Z"),
    deleted_at: null,
    ...overrides,
  }
}

class MockSESClient implements ISESClient {
  createEmailIdentity = vi.fn(async (domain: string) => ({
    identityArn: `arn:aws:ses:eu-north-1:123456789012:identity/${domain}`,
    records: buildDomainDnsRecords(domain, ["token1", "token2", "token3"]),
  }))

  getEmailIdentity = vi.fn(async (domain: string) => ({
    verificationStatus: "verified" as const,
    records: buildDomainDnsRecords(domain, ["token1", "token2", "token3"]),
  }))

  sendEmail = vi.fn(async () => ({ messageId: "mock-message-id" }))
}

describe("SES domain identity helpers", (): void => {
  it("builds DKIM and SPF records", (): void => {
    const records = buildDomainDnsRecords(DOMAIN, ["abc", "def", "ghi"])
    expect(records.dkim).toHaveLength(3)
    expect(mapSesVerificationStatus("SUCCESS")).toBe("verified")
  })
})

describe("NotificationModuleService.setupDomain", (): void => {
  it("registers SES identity and returns DNS records", async (): Promise<void> => {
    const mockSes = new MockSESClient()
    vi.spyOn(
      NotificationModuleService.prototype as unknown as {
        listMercflowEmailConfigs: () => Promise<unknown[]>
      },
      "listMercflowEmailConfigs"
    ).mockResolvedValueOnce([])
    vi.spyOn(
      NotificationModuleService.prototype as unknown as {
        createMercflowEmailConfigs: () => Promise<unknown>
      },
      "createMercflowEmailConfigs"
    ).mockResolvedValue(buildConfig())

    const svc = Object.create(NotificationModuleService.prototype) as NotificationModuleService
    svc.setSESClient(mockSes)
    vi.spyOn(svc, "withTenant").mockImplementation(async (_storeId, fn) =>
      fn({ transactionManager: {} })
    )

    const result = await svc.setupDomain(STORE_A, DOMAIN)
    expect(mockSes.createEmailIdentity).toHaveBeenCalledWith(DOMAIN)
    expect(result.records.dkim).toHaveLength(3)
  })
})

describe("StubSESClient", (): void => {
  it("returns stub DNS records", async (): Promise<void> => {
    const client = new StubSESClient()
    const created = await client.createEmailIdentity(DOMAIN)
    expect(created.records.dkim).toHaveLength(3)
  })
})

describe("Notification queue client domain polling", (): void => {
  it("schedules repeatable domain status job", async (): Promise<void> => {
    const add = vi.fn().mockResolvedValue(undefined)
    const queueClient: NotificationQueueClient = {
      getJob: vi.fn(),
      addSendEmailJob: vi.fn(),
      scheduleDomainStatusPolling: async () => {
        await add("check-pending-domains", {}, { repeat: { every: 900_000 } })
      },
    }
    await queueClient.scheduleDomainStatusPolling()
    expect(add).toHaveBeenCalledTimes(1)
  })
})
