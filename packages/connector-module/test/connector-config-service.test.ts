import { beforeEach, describe, expect, it, vi } from "vitest"

import EncryptionService from "../src/modules/connector/encryption-service"
import ConnectorConfigService from "../src/modules/connector/service"

const TEST_KEY =
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"

describe("ConnectorConfigService credential crypto", () => {
  const encryptSpy = vi.spyOn(EncryptionService.prototype, "encrypt")
  const decryptSpy = vi.spyOn(EncryptionService.prototype, "decrypt")

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("save encrypts credentials before passing them to create", async () => {
    const create = vi.fn(async (rows: unknown[]) => rows)
    const list = vi.fn(async () => [])
    const container = {
      baseRepository: {
        serialize: async (data: unknown) => data,
        getFreshManager: () => ({}),
      },
      connectorConfigService: {
        create,
        update: vi.fn(),
        retrieve: vi.fn(),
        list,
        listAndCount: vi.fn(),
        delete: vi.fn(),
        softDelete: vi.fn(),
        restore: vi.fn(),
      },
      connectorLogService: {
        create: vi.fn(),
        update: vi.fn(),
        retrieve: vi.fn(),
        list: vi.fn(),
        listAndCount: vi.fn(),
        delete: vi.fn(),
        softDelete: vi.fn(),
        restore: vi.fn(),
      },
    }

    const encryption = new EncryptionService({ keyHex: TEST_KEY })
    const svc = new ConnectorConfigService(container, { encryption })

    await svc.save({ type: "stripe", credentials: '{"k":"v"}' })

    expect(encryptSpy).toHaveBeenCalledWith('{"k":"v"}')
    expect(create).toHaveBeenCalled()
    const createArgs = create.mock.calls[0]
    const rawPayload = createArgs?.[0]
    const payload = (
      Array.isArray(rawPayload) ? rawPayload[0] : rawPayload
    ) as { credentials_encrypted?: string }
    expect(payload?.credentials_encrypted).toBeDefined()
    expect(payload?.credentials_encrypted).not.toBe('{"k":"v"}')
    expect(decryptSpy).toHaveBeenCalledWith(payload?.credentials_encrypted)
    expect(await encryption.decrypt(payload.credentials_encrypted!)).toBe(
      '{"k":"v"}'
    )
  })

  it("get decrypts stored ciphertext before returning credentials", async () => {
    const encryption = new EncryptionService({ keyHex: TEST_KEY })
    const stored = encryption.encrypt("plain-secret")

    const retrieve = vi.fn(async () => ({
      id: "cfg_1",
      type: "gtm",
      credentials_encrypted: stored,
      active: true,
      created_at: new Date(),
      updated_at: new Date(),
    }))

    const container = {
      baseRepository: {
        serialize: async (data: unknown) => data,
        getFreshManager: () => ({}),
      },
      connectorConfigService: {
        create: vi.fn(),
        update: vi.fn(),
        retrieve,
        list: vi.fn(),
        listAndCount: vi.fn(),
        delete: vi.fn(),
        softDelete: vi.fn(),
        restore: vi.fn(),
      },
      connectorLogService: {
        create: vi.fn(),
        update: vi.fn(),
        retrieve: vi.fn(),
        list: vi.fn(),
        listAndCount: vi.fn(),
        delete: vi.fn(),
        softDelete: vi.fn(),
        restore: vi.fn(),
      },
    }

    const svc = new ConnectorConfigService(container, { encryption })
    const row = await svc.get("cfg_1")

    expect(retrieve).toHaveBeenCalledWith(
      "cfg_1",
      undefined,
      expect.objectContaining({ __type: "MedusaContext" })
    )
    expect(row.credentials).toBe("plain-secret")
    expect(decryptSpy).toHaveBeenCalledWith(stored)
  })
})
