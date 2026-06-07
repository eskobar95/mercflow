/**
 * Client-side slug preview for article titles — mirrors
 * `packages/content-module/src/modules/content/utils/transliterate-nordic-slug.ts`
 * (MER-34 Nordic rules).
 */
const NORDIC_REPLACEMENTS: Record<string, string> = {
  ø: "o",
  Ø: "o",
  å: "a",
  Å: "a",
  æ: "ae",
  Æ: "ae",
  ö: "o",
  Ö: "o",
  ä: "a",
  Ä: "a",
}

function transliterateNordicForSlug(input: string): string {
  let out = ""
  for (const ch of input) {
    out += NORDIC_REPLACEMENTS[ch] ?? ch
  }
  return out
}

export function slugifyTitleToArticleSegment(title: string): string {
  const transliterated = transliterateNordicForSlug(title.trim())
  const withoutCombining = transliterated
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
  const lower = withoutCombining.toLowerCase()
  const kebab = lower
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
  return kebab.length > 0 ? kebab : "article"
}
