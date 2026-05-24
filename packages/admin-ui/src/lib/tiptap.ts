import type { JSONContent } from "@tiptap/core"

export const EMPTY_TIPTAP_DOC: JSONContent = {
  type: "doc",
  content: [{ type: "paragraph" }],
}

export function tiptapDocFromUnknown(value: unknown): JSONContent {
  if (value === null || value === undefined) {
    return EMPTY_TIPTAP_DOC
  }
  if (typeof value !== "object" || Array.isArray(value)) {
    return EMPTY_TIPTAP_DOC
  }
  const rec = value as Record<string, unknown>
  if (rec.type === "doc") {
    return value as JSONContent
  }
  return EMPTY_TIPTAP_DOC
}

/**
 * Lightweight preview text for TipTap JSON (read-only storefront/admin summaries).
 */
export function plaintextPreviewFromTiptapJson(value: unknown, maxChars: number): string {
  const doc = tiptapDocFromUnknown(value)
  const chunks: string[] = []
  const walk = (node: JSONContent | undefined): void => {
    if (node === undefined) {
      return
    }
    if (node.text != null && typeof node.text === "string") {
      chunks.push(node.text)
      return
    }
    const next = node.content
    if (!Array.isArray(next)) {
      return
    }
    for (const child of next) {
      walk(child)
    }
  }
  walk(doc)
  const joined = chunks.join("\n").replace(/\s+\n/g, "\n").trim()
  const limit = Math.max(0, maxChars)
  if (limit <= 0) {
    return ""
  }
  if (joined.length <= limit) {
    return joined
  }
  return `${joined.slice(0, limit).trim()}…`
}
