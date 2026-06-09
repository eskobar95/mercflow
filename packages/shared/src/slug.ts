export type SlugStrategy = "nordic" | "omit"

const NORDIC_OMIT_REPLACEMENTS: Record<string, string> = {
  ø: "o",
  Ø: "o",
  å: "a",
  Å: "a",
  æ: "a",
  Æ: "a",
  ö: "o",
  Ö: "o",
  ä: "a",
  Ä: "a",
}

const NORDIC_FULL_REPLACEMENTS: Record<string, string> = {
  ø: "oe",
  Ø: "oe",
  å: "aa",
  Å: "aa",
  æ: "ae",
  Æ: "ae",
  ö: "oe",
  Ö: "oe",
  ä: "ae",
  Ä: "ae",
}

const ACCENT_REPLACEMENTS: Record<string, string> = {
  é: "e",
  É: "e",
  è: "e",
  È: "e",
  ê: "e",
  Ê: "e",
  ü: "u",
  Ü: "u",
}

function applyReplacements(input: string, map: Record<string, string>): string {
  let out = ""
  for (const ch of input) {
    out += map[ch] ?? ACCENT_REPLACEMENTS[ch] ?? ch
  }
  return out
}

function applyAccentRules(input: string, strategy: SlugStrategy): string {
  let out = ""
  for (const ch of input) {
    const accent = ACCENT_REPLACEMENTS[ch]
    if (accent) {
      if (strategy === "nordic" && (ch === "ü" || ch === "Ü")) {
        out += "ue"
      } else if (strategy === "nordic" && (ch === "ö" || ch === "Ö")) {
        out += "oe"
      } else if (strategy === "nordic" && (ch === "ä" || ch === "Ä")) {
        out += "ae"
      } else {
        out += accent
      }
      continue
    }
    out += ch
  }
  return out
}

/**
 * Pure slug utility for MercFlow SEO (S002 / J001).
 * Nordic: ø→oe, æ→ae, å→aa. Omit: ø→o, æ→a, å→a.
 */
export function slugifyForStrategy(title: string, strategy: SlugStrategy): string {
  const trimmed = title.trim()
  const nordicMap = strategy === "nordic" ? NORDIC_FULL_REPLACEMENTS : NORDIC_OMIT_REPLACEMENTS
  const transliterated = applyAccentRules(applyReplacements(trimmed, nordicMap), strategy)
  const withoutCombining = transliterated
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
  const lower = withoutCombining.toLowerCase()
  const kebab = lower
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
  return kebab.length > 0 ? kebab : "item"
}
