/** Strip rudimentary HTML for read-only previews in admin surfaces. TipTap JSON is out of scope here. */
export function previewPlainText(markup: string | null | undefined, maxChars: number): string | null {
  if (typeof markup !== "string" || markup.trim() === "") {
    return null
  }
  if (typeof document !== "undefined") {
    try {
      const doc = document.implementation.createHTMLDocument("")
      const div = doc.createElement("div")
      div.innerHTML = markup
      const text = div.textContent ?? ""
      return clipLength(text.trim(), maxChars)
    } catch {
      // fall through
    }
  }
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
