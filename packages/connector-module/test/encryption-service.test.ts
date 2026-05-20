import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { MedusaError } from "@medusajs/utils"

import EncryptionService from "../src/modules/connector/encryption-service"

const TEST_KEY =
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"

describe("EncryptionService", () => {
  const prev = process.env.MERCFLOW_CONNECTOR_ENCRYPTION_KEY

  beforeEach(() => {
    vi.unstubAllEnvs()
    delete process.env.MERCFLOW_CONNECTOR_ENCRYPTION_KEY
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    if (prev === undefined) {
      delete process.env.MERCFLOW_CONNECTOR_ENCRYPTION_KEY
    } else {
      process.env.MERCFLOW_CONNECTOR_ENCRYPTION_KEY = prev
    }
  })

  it("throws MedusaError when env key is missing", () => {
    expect(() => new EncryptionService()).toThrow(MedusaError)
    try {
      new EncryptionService()
    } catch (e: unknown) {
      expect(e).toBeInstanceOf(MedusaError)
      expect((e as MedusaError).message).toContain("MERCFLOW_CONNECTOR_ENCRYPTION_KEY")
    }
  })

  it("throws when env key is not 64 hex chars", () => {
    process.env.MERCFLOW_CONNECTOR_ENCRYPTION_KEY = "deadbeef"
    expect(() => new EncryptionService()).toThrow(MedusaError)
  })

  it("throws when env key contains non-hex", () => {
    process.env.MERCFLOW_CONNECTOR_ENCRYPTION_KEY = `${"ab".repeat(31)}gz`
    expect(() => new EncryptionService()).toThrow(MedusaError)
  })

  it("uses injected keyHex over env", () => {
    process.env.MERCFLOW_CONNECTOR_ENCRYPTION_KEY = `${"ff".repeat(32)}`
    const svc = new EncryptionService({ keyHex: TEST_KEY })
    const out = svc.encrypt("hello")
    expect(svc.decrypt(out)).toBe("hello")
  })

  it("treats whitespace-only keyHex as missing and uses env", () => {
    process.env.MERCFLOW_CONNECTOR_ENCRYPTION_KEY = TEST_KEY
    const svc = new EncryptionService({ keyHex: "  \n\t  " })
    expect(svc.decrypt(svc.encrypt("via-env"))).toBe("via-env")
  })

  it("encrypt → decrypt roundtrip", () => {
    const svc = new EncryptionService({ keyHex: TEST_KEY })
    const secret = '{"token":"abc"}'
    const enc = svc.encrypt(secret)
    expect(svc.decrypt(enc)).toBe(secret)
  })

  it("encrypt → decrypt roundtrip for empty plaintext", () => {
    const svc = new EncryptionService({ keyHex: TEST_KEY })
    const enc = svc.encrypt("")
    expect(svc.decrypt(enc)).toBe("")
  })

  it("produces different ciphertext for the same plaintext (random IV)", () => {
    const svc = new EncryptionService({ keyHex: TEST_KEY })
    const a = svc.encrypt("same")
    const b = svc.encrypt("same")
    expect(a).not.toBe(b)
  })

  it("produces different ciphertext for different plaintexts", () => {
    const svc = new EncryptionService({ keyHex: TEST_KEY })
    const a = svc.encrypt("one")
    const b = svc.encrypt("two")
    expect(a).not.toBe(b)
  })

  it("throws on decrypt when ciphertext was tampered", () => {
    const svc = new EncryptionService({ keyHex: TEST_KEY })
    const enc = svc.encrypt("intact")
    const buf = Buffer.from(enc.slice(4), "base64")
    if (buf.length > 20) {
      buf[20] = buf[20]! ^ 0xff
    }
    const tampered = `mf1:${buf.toString("base64")}`
    expect(() => svc.decrypt(tampered)).toThrow(MedusaError)
  })

  it("throws on wrong version prefix", () => {
    const svc = new EncryptionService({ keyHex: TEST_KEY })
    expect(() => svc.decrypt("xx0:abc")).toThrow(MedusaError)
  })

  it("throws on truncated ciphertext", () => {
    const svc = new EncryptionService({ keyHex: TEST_KEY })
    expect(() => svc.decrypt("mf1:YQ")).toThrow(MedusaError)
  })

  it("throws when decrypting with a different key", () => {
    const a = new EncryptionService({ keyHex: TEST_KEY })
    const otherKey = `${"ee".repeat(32)}`
    const b = new EncryptionService({ keyHex: otherKey })
    const enc = a.encrypt("secret")
    expect(() => b.decrypt(enc)).toThrow(MedusaError)
  })
})
