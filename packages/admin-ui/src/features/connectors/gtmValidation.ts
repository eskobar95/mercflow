/**
 * Validates the canonical GTM public container identifier after trimming / uppercasing ASCII.
 */
export const GTM_CONTAINER_ID_INPUT_PATTERN = /^GTM-[A-Z0-9]+$/

export function normalizeGtmContainerIdInput(raw: string): string {
  return raw.trim().toUpperCase()
}
