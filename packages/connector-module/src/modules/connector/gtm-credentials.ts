import { MedusaError } from "@medusajs/utils"

export type GtmCredentialsPayload = {
  container_id: string
}

export function serializeGtmCredentials(payload: GtmCredentialsPayload): string {
  return JSON.stringify(payload)
}

export function parseDecryptedGtmCredentials(
  plaintext: string
): GtmCredentialsPayload {
  let parsed: unknown
  try {
    parsed = JSON.parse(plaintext) as unknown
  } catch {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Stored GTM connector credentials could not be parsed as JSON"
    )
  }

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    Array.isArray(parsed) ||
    typeof (parsed as GtmCredentialsPayload).container_id !== "string"
  ) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Stored GTM connector credentials have an unexpected shape"
    )
  }

  const { container_id: containerId } = parsed as GtmCredentialsPayload
  if (!containerId) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Stored GTM credentials are missing container_id"
    )
  }

  return { container_id: containerId }
}
