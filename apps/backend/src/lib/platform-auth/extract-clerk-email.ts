/**
 * Resolves the operator email from a verified Clerk JWT payload.
 * Configure the mercflow-platform JWT template to include `email` when possible.
 */
export function extractClerkEmailFromPayload(
  payload: Record<string, unknown>,
): string | null {
  const candidates = [
    payload.email,
    payload.primary_email_address,
    payload.email_address,
  ]

  for (const value of candidates) {
    if (typeof value === "string" && value.includes("@")) {
      return value.trim().toLowerCase()
    }
  }

  return null
}

export function isAllowedOperatorEmail(
  email: string,
  allowedDomain: string,
): boolean {
  const normalizedDomain = allowedDomain.trim().toLowerCase().replace(/^@/, "")
  if (!normalizedDomain) {
    return false
  }

  return email.endsWith(`@${normalizedDomain}`)
}
