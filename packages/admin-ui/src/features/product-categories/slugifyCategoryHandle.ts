/**
 * Produces a Medusa-compatible handle slug from a display name (lowercase,
 * hyphen-separated). Empty/whitespace names yield an empty string.
 */
export function slugifyCategoryHandle(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}
