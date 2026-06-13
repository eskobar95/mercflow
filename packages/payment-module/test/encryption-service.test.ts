import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { MedusaError } from "@medusajs/utils"

import EncryptionService, { ENV_VAR_NAME } from "../src/modules/payment/encryption-service"

const TEST_KEY =
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"

describe("EncryptionService", () => {
  const prev = process.env[ENV_VAR_NAME]

  beforeEach(() => {
    vi.unstubAllEnvs()
    delete process.env[ENV_VAR_NAME]
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    if (prev === undefined) {
      delete process.env[ENV_VAR_NAME]
    } else {
      process.env[ENV_VAR_NAME] = prev
    }
  })

  it("throws MedusaError when env key is missing", () => {
    expect(() => new EncryptionService()).toThrow(MedusaError)
    try {
      new EncryptionService()
    } catch (e: unknown) {
      expect(e).toBeInstanceOf(MedusaError)
      expect((e as MedusaError).message).toContain(ENV_VAR_NAME)
    }
  })

  it("throws when env key is not 64 hex chars", () => {
    process.env[ENV_VAR_NAME] = "deadbeef"
    expect(() => new EncryptionService()).toThrow(MedusaError)
  })

  it("encrypt → decrypt roundtrip", () => {
    const svc = new EncryptionService({ keyHex: TEST_KEY })
    const secret = "test_provider_secret_key"
    const enc = svc.encrypt(secret)
    expect(svc.decrypt(enc)).toBe(secret)
  })

  it("produces different ciphertext for the same plaintext (random IV)", () => {
    const svc = new EncryptionService({ keyHex: TEST_KEY })
    const a = svc.encrypt("same")
    const b = svc.encrypt("same")
    expect(a).not.toBe(b)
  })
})
