export function normalizeEmailDomain(domain: string): string {
  return domain.trim().toLowerCase().replace(/^@/, "")
}

export function isAllowedOperatorEmail(
  email: string | null | undefined,
  allowedDomain: string,
): boolean {
  if (!email) {
    return false
  }

  const normalized = email.trim().toLowerCase()
  const domain = normalizeEmailDomain(allowedDomain)
  if (!domain) {
    return false
  }

  return normalized.endsWith(`@${domain}`)
}
