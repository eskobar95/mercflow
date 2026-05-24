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
