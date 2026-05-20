import crypto from "node:crypto"

import { MedusaError } from "@medusajs/utils"

const ENV_VAR_NAME = "MERCFLOW_CONNECTOR_ENCRYPTION_KEY"
const ALGORITHM = "aes-256-gcm"
const IV_LENGTH_BYTES = 12
const AUTH_TAG_LENGTH_BYTES = 16
const VERSION_PREFIX = "mf1:"

export type EncryptionServiceOptions = {
  /**
   * 64 hex chars (32 bytes). Used in tests; production resolves from env.
   */
  keyHex?: string
}

function parseKeyFromHex(hex: string): Buffer {
  const trimmed = hex.trim()
  if (trimmed.length !== 64) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `${ENV_VAR_NAME} must be a 64-character hexadecimal string representing 32 bytes for AES-256-GCM`
    )
  }

  if (!/^[0-9a-fA-F]{64}$/.test(trimmed)) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `${ENV_VAR_NAME} must contain only hexadecimal characters (0-9, a-f)`
    )
  }

  return Buffer.from(trimmed, "hex")
}

/**
 * AES-256-GCM encrypt/decrypt for connector credentials.
 * Ciphertext format: `mf1:` + base64(iv(12) || authTag(16) || ciphertext).
 */
export default class EncryptionService {
  private readonly key: Buffer

  constructor(options?: EncryptionServiceOptions) {
    const fromOptions = options?.keyHex
    const fromEnv = process.env[ENV_VAR_NAME]
    const resolved =
      fromOptions !== undefined && fromOptions !== null && String(fromOptions).trim() !== ""
        ? String(fromOptions).trim()
        : fromEnv !== undefined && fromEnv !== null && String(fromEnv).trim() !== ""
          ? String(fromEnv).trim()
          : null

    if (resolved === null) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `${ENV_VAR_NAME} must be set to a 64-character hex string (32 bytes) so connector credentials can be encrypted at rest`
      )
    }

    this.key = parseKeyFromHex(resolved)
  }

  encrypt(plaintext: string): string {
    const iv = crypto.randomBytes(IV_LENGTH_BYTES)
    const cipher = crypto.createCipheriv(ALGORITHM, this.key, iv, {
      authTagLength: AUTH_TAG_LENGTH_BYTES,
    })
    const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()])
    const authTag = cipher.getAuthTag()
    const combined = Buffer.concat([iv, authTag, ciphertext])
    return `${VERSION_PREFIX}${combined.toString("base64")}`
  }

  decrypt(encoded: string): string {
    if (!encoded.startsWith(VERSION_PREFIX)) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Stored connector credentials have an unknown format or version prefix"
      )
    }

    const b64 = encoded.slice(VERSION_PREFIX.length)
    const combined = Buffer.from(b64, "base64")
    if (combined.length < IV_LENGTH_BYTES + AUTH_TAG_LENGTH_BYTES) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Stored connector credentials are truncated or corrupted"
      )
    }

    const iv = combined.subarray(0, IV_LENGTH_BYTES)
    const authTag = combined.subarray(
      IV_LENGTH_BYTES,
      IV_LENGTH_BYTES + AUTH_TAG_LENGTH_BYTES
    )
    const ciphertext = combined.subarray(IV_LENGTH_BYTES + AUTH_TAG_LENGTH_BYTES)

    const decipher = crypto.createDecipheriv(ALGORITHM, this.key, iv, {
      authTagLength: AUTH_TAG_LENGTH_BYTES,
    })
    decipher.setAuthTag(authTag)
    try {
      return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8")
    } catch {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Stored connector credentials could not be decrypted (wrong key or tampered data)"
      )
    }
  }
}
