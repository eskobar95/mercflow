import { describe, expect, it, vi } from "vitest"

import EncryptionService from "../src/modules/connector/encryption-service"
import ConnectorConfigService from "../src/modules/connector/service"

const TEST_KEY =
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"

function connectorLogStubs(): Record<string, ReturnType<typeof vi.fn>> {
  return {
    create: vi.fn(),
    update: vi.fn(),
    retrieve: vi.fn(),
    list: vi.fn(),
    listAndCount: vi.fn(),
    delete: vi.fn(),
    softDelete: vi.fn(),
    restore: vi.fn(),
  }
}

describe("ConnectorConfigService.listConnectorAdminSummaries", () => {
  it("returns four connector types when the database has no configs", async () => {
    const list = vi.fn(async () => [])
    const container = {
      baseRepository: {
        serialize: async (data: unknown) => data,
        getFreshManager: () => ({}),
      },
      connectorConfigService: {
        create: vi.fn(),
        update: vi.fn(),
        retrieve: vi.fn(),
        list,
        listAndCount: vi.fn(),
        delete: vi.fn(),
        softDelete: vi.fn(),
        restore: vi.fn(),
      },
      connectorLogService: connectorLogStubs(),
    }

    const encryption = new EncryptionService({ keyHex: TEST_KEY })
    const svc = new ConnectorConfigService(container, { encryption })
    const rows = await svc.listConnectorAdminSummaries()

    expect(list).toHaveBeenCalledTimes(1)
    expect(rows).toHaveLength(4)
    expect(rows.map((r) => r.type)).toEqual(["shipmondo", "stripe", "plunk", "gtm"])
    expect(rows.every((r) => r.configured === false)).toBe(true)
    expect(rows.every((r) => r.active === false)).toBe(true)
    expect(rows.every((r) => r.lastTestedAt === null)).toBe(true)
  })

  it("marks configured Stripe row active without decrypting credentials", async () => {
    const list = vi.fn(async () => [
      {
        id: "cfg_1",
        type: "stripe",
        credentials_encrypted: "opaque-ciphertext",
        active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ])

    const container = {
      baseRepository: {
        serialize: async (data: unknown) => data,
        getFreshManager: () => ({}),
      },
      connectorConfigService: {
        create: vi.fn(),
        update: vi.fn(),
        retrieve: vi.fn(),
        list,
        listAndCount: vi.fn(),
        delete: vi.fn(),
        softDelete: vi.fn(),
        restore: vi.fn(),
      },
      connectorLogService: connectorLogStubs(),
    }

    const decryptSpy = vi.spyOn(EncryptionService.prototype, "decrypt")

    const encryption = new EncryptionService({ keyHex: TEST_KEY })
    const svc = new ConnectorConfigService(container, { encryption })

    try {
      const rows = await svc.listConnectorAdminSummaries()
      const stripeRow = rows.find((r) => r.type === "stripe")
      const shipmondoRow = rows.find((r) => r.type === "shipmondo")

      expect(decryptSpy).not.toHaveBeenCalled()

      expect(stripeRow?.configured).toBe(true)
      expect(stripeRow?.active).toBe(true)

      expect(shipmondoRow?.configured).toBe(false)
      expect(shipmondoRow?.active).toBe(false)
    } finally {
      decryptSpy.mockRestore()
    }
  })

  it("returns inactive badge data when Stripe exists but disabled", async () => {
    const list = vi.fn(async () => [
      {
        id: "cfg_1",
        type: "stripe",
        credentials_encrypted: "opaque-ciphertext",
        active: false,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ])

    const container = {
      baseRepository: {
        serialize: async (data: unknown) => data,
        getFreshManager: () => ({}),
      },
      connectorConfigService: {
        create: vi.fn(),
        update: vi.fn(),
        retrieve: vi.fn(),
        list,
        listAndCount: vi.fn(),
        delete: vi.fn(),
        softDelete: vi.fn(),
        restore: vi.fn(),
      },
      connectorLogService: connectorLogStubs(),
    }

    const encryption = new EncryptionService({ keyHex: TEST_KEY })
    const svc = new ConnectorConfigService(container, { encryption })
    const rows = await svc.listConnectorAdminSummaries()
    const stripeRow = rows.find((r) => r.type === "stripe")

    expect(stripeRow?.configured).toBe(true)
    expect(stripeRow?.active).toBe(false)
  })
})
