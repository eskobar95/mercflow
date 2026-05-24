/**
 * Produce a deterministic masked label for masked UI fields — never echoes full secrets.
 */
export function maskStripeField(label: string, last4: string | null | undefined): string | null {
  if (last4 == null || last4.trim() === "") {
    return null
  }
  const trimmed = last4.trim()
  return `${label} ••••${trimmed.slice(-4)}`
}
