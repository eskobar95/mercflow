/**
 * Nordic transliteration for URL slugs (MER-34).
 * Ø→o, Å→a, Æ→ae, Ö→o, Ä→a (case-insensitive handling via explicit upper+lower entries).
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

export function transliterateNordicForSlug(input: string): string {
  let out = ""
  for (const ch of input) {
    out += NORDIC_REPLACEMENTS[ch] ?? ch
  }
  return out
}

/**
 * Produces a single kebab-case slug segment from a human title (ASCII + Nordic rules).
 * Falls back to `"article"` when the title yields an empty slug.
 */
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
