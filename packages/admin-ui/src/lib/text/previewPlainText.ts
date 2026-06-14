/** Strip rudimentary HTML for read-only previews in admin surfaces. TipTap JSON is out of scope here. */
export function previewPlainText(markup: string | null | undefined, maxChars: number): string | null {
  if (typeof markup !== "string" || markup.trim() === "") {
    return null
  }
  // Call sites pass Medusa plain-text descriptions for preview only — no HTML rendering.
  // Regex strip avoids innerHTML/DOM parsing on untrusted strings (XSS-safe plain-text extraction).
  const stripped = markup.replace(/<[^>]+>/gu, "").replace(/\s+/gu, " ").trim()
  return clipLength(stripped, maxChars)
}

function clipLength(source: string, maxChars: number): string | null {
  if (source.length === 0) {
    return null
  }
  if (source.length <= maxChars) {
    return source
  }
  return `${source.slice(0, maxChars - 1)}…`
}
