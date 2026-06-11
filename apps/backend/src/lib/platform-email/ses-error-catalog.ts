const SES_ERROR_DESCRIPTIONS: Record<string, string> = {
  AccessDenied: "AWS credentials lack permission to send via SES.",
  AccountSendingPaused: "SES has paused sending for this AWS account.",
  ConfigurationSetDoesNotExist: "The SES configuration set does not exist.",
  ConfigurationSetSendingPaused: "Sending is paused for the configuration set.",
  InvalidParameterValue: "SES rejected a parameter value in the send request.",
  MailFromDomainNotVerified: "The MAIL FROM domain is not verified in SES.",
  MessageRejected: "SES rejected the message (policy or content).",
  Throttling: "SES is throttling send requests — retry later.",
  ServiceUnavailable: "SES service is temporarily unavailable.",
}

export type ParsedSesError = {
  code: string | null
  description: string | null
}

export function describeSesError(code: string | null): string | null {
  if (!code) {
    return null
  }
  return SES_ERROR_DESCRIPTIONS[code] ?? `SES error code: ${code}`
}

export function parseSesError(errorMessage: string | null): ParsedSesError {
  if (!errorMessage?.trim()) {
    return { code: null, description: null }
  }

  const normalized = errorMessage.trim()

  const explicitCode = /(?:Error(?:Code)?|Code|status)[:\s]+["']?([A-Za-z0-9_]+)["']?/i.exec(
    normalized,
  )
  const code = explicitCode?.[1] ?? null

  if (code) {
    return {
      code,
      description: describeSesError(code) ?? normalized,
    }
  }

  for (const knownCode of Object.keys(SES_ERROR_DESCRIPTIONS)) {
    if (normalized.includes(knownCode)) {
      return {
        code: knownCode,
        description: SES_ERROR_DESCRIPTIONS[knownCode],
      }
    }
  }

  return {
    code: null,
    description: normalized,
  }
}
