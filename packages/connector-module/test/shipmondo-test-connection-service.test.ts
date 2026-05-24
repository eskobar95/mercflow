import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const probeShipmondoShipmentsMock = vi.hoisted(() => vi.fn())

vi.mock("../src/modules/connector/shipmondo-http-client", () => ({
  probeShipmondoShipments: probeShipmondoShipmentsMock,
}))

import EncryptionService from "../src/modules/connector/encryption-service"
import ConnectorModuleService from "../src/modules/connector/service"

/** 32-byte AES test key as 64 hex chars — derived from ASCII to avoid secret-scanner false positives. */
const TEST_HEX_KEY: string = Buffer.from(
  "unit-test-shipmondo-conn-key-32!",
  "utf8"
).toString("hex")

/** Minimal stub for `testShipmondoConnection` — Medusa-generated methods are read-only on the type. */
function stubConnectorService(mock: {
  listConnectorConfigs: ReturnType<typeof vi.fn>
  updateConnectorConfigs?: ReturnType<typeof vi.fn>
  createConnectorLogs?: ReturnType<typeof vi.fn>
}): ConnectorModuleService {
  const instance = Object.create(
    ConnectorModuleService.prototype
  ) as Record<string, unknown>

  instance.listConnectorConfigs = mock.listConnectorConfigs as ConnectorModuleService["listConnectorConfigs"]
  instance.updateConnectorConfigs =
    (mock.updateConnectorConfigs ?? vi.fn(async () => [])) as ConnectorModuleService["updateConnectorConfigs"]
  instance.createConnectorLogs =
    (mock.createConnectorLogs ?? vi.fn(async () => [])) as ConnectorModuleService["createConnectorLogs"]

  return instance as unknown as ConnectorModuleService
}

describe("ConnectorModuleService.testShipmondoConnection", (): void => {
  const encryption = new EncryptionService({ keyHex: TEST_HEX_KEY })
  let prevEncryptionKey: string | undefined

  beforeEach(() => {
    probeShipmondoShipmentsMock.mockReset()
    prevEncryptionKey = process.env.MERCFLOW_CONNECTOR_ENCRYPTION_KEY
    process.env.MERCFLOW_CONNECTOR_ENCRYPTION_KEY = TEST_HEX_KEY
  })

  afterEach(() => {
    probeShipmondoShipmentsMock.mockReset()
    if (prevEncryptionKey === undefined) {
      delete process.env.MERCFLOW_CONNECTOR_ENCRYPTION_KEY
    } else {
      process.env.MERCFLOW_CONNECTOR_ENCRYPTION_KEY = prevEncryptionKey
    }
  })

  it("returns success and records last-tested metadata when Shipmondo returns HTTP 200", async (): Promise<void> => {
    const ciphertext = encryption.encrypt(
      JSON.stringify({ api_user: "user", api_key: "secret" })
    )
    const rows = [
      {
        id: "conn_1",
        type: "shipmondo",
        credentials_encrypted: ciphertext,
        active: true,
        last_tested_at: null as Date | null,
      },
    ]
    probeShipmondoShipmentsMock.mockResolvedValueOnce({ ok: true, httpStatus: 200 })

    const updateConnectorConfigs = vi.fn(async () => [])
    const createConnectorLogs = vi.fn(async () => [])

    const svc = stubConnectorService({
      listConnectorConfigs: vi.fn(async () => rows),
      updateConnectorConfigs,
      createConnectorLogs,
    })

    const result = await svc.testShipmondoConnection()

    expect(result).toEqual({
      success: true,
      message: "Shipmondo connection succeeded (HTTP 200)",
    })
    expect(probeShipmondoShipmentsMock).toHaveBeenCalledWith({
      apiUser: "user",
      apiKey: "secret",
      fetchImpl: undefined,
    })
    expect(updateConnectorConfigs).toHaveBeenCalledWith({
      id: "conn_1",
      last_tested_at: expect.any(Date),
    })
    expect(createConnectorLogs).toHaveBeenCalledWith(
      expect.objectContaining({
        connector_id: "conn_1",
        event: "connection_test_pass",
      })
    )
  })

  it("returns error when Shipmondo returns a non-success HTTP status", async (): Promise<void> => {
    const ciphertext = encryption.encrypt(JSON.stringify({ api_user: "u", api_key: "p" }))
    const rows = [
      {
        id: "conn_2",
        type: "shipmondo",
        credentials_encrypted: ciphertext,
        active: true,
        last_tested_at: null as Date | null,
      },
    ]
    probeShipmondoShipmentsMock.mockResolvedValueOnce({ ok: false, httpStatus: 401 })

    const updateConnectorConfigs = vi.fn(async () => [])
    const createConnectorLogs = vi.fn(async () => [])

    const svc = stubConnectorService({
      listConnectorConfigs: vi.fn(async () => rows),
      updateConnectorConfigs,
      createConnectorLogs,
    })

    const result = await svc.testShipmondoConnection()

    expect(result).toEqual({ success: false, error: "Shipmondo returned HTTP 401" })
    expect(updateConnectorConfigs).not.toHaveBeenCalled()
    expect(createConnectorLogs).toHaveBeenCalledWith(
      expect.objectContaining({
        connector_id: "conn_2",
        event: "connection_test_fail",
      })
    )
  })

  it("returns structured error without calling HTTP when Shipmondo is not configured", async (): Promise<void> => {
    const svc = stubConnectorService({
      listConnectorConfigs: vi.fn(async () => []),
    })

    await expect(svc.testShipmondoConnection()).resolves.toEqual({
      success: false,
      error: "Shipmondo is not configured yet",
    })

    expect(probeShipmondoShipmentsMock).not.toHaveBeenCalled()
  })
})
