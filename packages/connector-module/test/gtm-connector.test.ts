import { beforeEach, describe, expect, it, vi } from "vitest"
import { MedusaError } from "@medusajs/utils"

import EncryptionService from "../src/modules/connector/encryption-service"
import { GtmConnector } from "../src/modules/connector/gtm-connector"

const TEST_KEY_HEX =
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"

describe("GtmConnector", () => {
  const encryption = new EncryptionService({ keyHex: TEST_KEY_HEX })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("save creates a new connector_config row when none exists", async () => {
    const listConnectorConfigs = vi.fn().mockResolvedValue([])
    const createConnectorConfigs = vi.fn().mockResolvedValue([{}])
    const updateConnectorConfigs = vi.fn()

    const connector = new GtmConnector(
      {
        listConnectorConfigs,
        createConnectorConfigs,
        updateConnectorConfigs,
      },
      encryption
    )

    await connector.save("GTM-ABCDEF")

    expect(listConnectorConfigs).toHaveBeenCalledWith({ type: "gtm" })
    expect(createConnectorConfigs).toHaveBeenCalledTimes(1)

    const createArg = createConnectorConfigs.mock.calls[0]?.[0] as Record<
      string,
      unknown
    >
    expect(createArg.type).toBe("gtm")
    expect(createArg.active).toBe(true)
    expect(createArg.last_tested_at).toBeNull()

    expect(typeof createArg.credentials_encrypted).toBe("string")

    expect(updateConnectorConfigs).not.toHaveBeenCalled()
    const decrypted = encryption.decrypt(
      createArg.credentials_encrypted as string
    )
    expect(JSON.parse(decrypted)).toEqual({ container_id: "GTM-ABCDEF" })
  })

  it("save updates credentials when gtm connector already exists", async () => {
    const existingId = "cfg_0101"
    const listConnectorConfigs = vi.fn().mockResolvedValue([
      {
        id: existingId,
        type: "gtm",
        credentials_encrypted: encryption.encrypt(
          JSON.stringify({ container_id: "GTM-OLD01" })
        ),
        active: true,
        last_tested_at: null,
      },
    ])
    const createConnectorConfigs = vi.fn()
    const updateConnectorConfigs = vi.fn().mockResolvedValue({})

    const connector = new GtmConnector(
      {
        listConnectorConfigs,
        createConnectorConfigs,
        updateConnectorConfigs,
      },
      encryption
    )

    await connector.save("GTM-NEW01")

    expect(createConnectorConfigs).not.toHaveBeenCalled()

    expect(updateConnectorConfigs).toHaveBeenCalledTimes(1)

    const updateArg = updateConnectorConfigs.mock.calls[0]?.[0] as Record<
      string,
      unknown
    >
    expect(updateArg.id).toBe(existingId)
    expect(updateArg.active).toBe(true)
    const decrypted = encryption.decrypt(
      updateArg.credentials_encrypted as string
    )
    expect(JSON.parse(decrypted)).toEqual({ container_id: "GTM-NEW01" })
  })

  it("get returns container_id after save", async () => {
    const encryptionService = new EncryptionService({ keyHex: TEST_KEY_HEX })
    let stored: Record<string, unknown> | null = null

    const listConnectorConfigs = vi.fn().mockImplementation(async () => {
      if (!stored) {
        return []
      }
      return [stored]
    })
    const createConnectorConfigs = vi.fn().mockImplementation((data) => {
      stored = {
        id: "new_id",
        type: (data as Record<string, unknown>).type,
        credentials_encrypted: (data as Record<string, unknown>)
          .credentials_encrypted,
        active: (data as Record<string, unknown>).active,
        last_tested_at: (data as Record<string, unknown>).last_tested_at,
      }
      return [stored]
    })
    const updateConnectorConfigs = vi.fn()

    const connector = new GtmConnector(
      {
        listConnectorConfigs,
        createConnectorConfigs,
        updateConnectorConfigs,
      },
      encryptionService
    )

    expect(await connector.get()).toBeNull()

    await connector.save("GTM-ABCDEF")
    await expect(connector.get()).resolves.toBe("GTM-ABCDEF")
  })

  it("get returns null when stored ciphertext cannot be decrypted", async () => {
    const listConnectorConfigs = vi.fn().mockResolvedValue([
      {
        id: "cfg_x",
        type: "gtm",
        credentials_encrypted: "mf1:YmFk",
        active: true,
        last_tested_at: null,
      },
    ])
    const createConnectorConfigs = vi.fn()
    const updateConnectorConfigs = vi.fn()

    const connector = new GtmConnector(
      {
        listConnectorConfigs,
        createConnectorConfigs,
        updateConnectorConfigs,
      },
      encryption
    )

    await expect(connector.get()).resolves.toBeNull()
  })

  it("save rejects container ids that violate the accepted pattern", async () => {
    const listConnectorConfigs = vi.fn()
    const createConnectorConfigs = vi.fn()

    const connector = new GtmConnector(
      {
        listConnectorConfigs,
        createConnectorConfigs,
        updateConnectorConfigs: vi.fn(),
      },
      encryption
    )

    await expect(connector.save("bad-id")).rejects.toThrow(MedusaError)

    expect(listConnectorConfigs).not.toHaveBeenCalled()
    expect(createConnectorConfigs).not.toHaveBeenCalled()
  })
})
