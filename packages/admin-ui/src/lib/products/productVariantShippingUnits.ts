/** Medusa stores variant dimensions in millimeters; the admin UI displays centimeters. */
export const MM_PER_CM = 10

export function medusaMmToDisplayCm(mm: number | null | undefined): string {
  if (mm === null || mm === undefined || !Number.isFinite(mm)) {
    return ""
  }
  const cm = mm / MM_PER_CM
  const formatted = cm.toFixed(2).replace(/\.?0+$/u, "")
  return formatted === "0" && cm !== 0 ? String(cm) : formatted
}

export function displayCmToMedusaMm(cmInput: string): number | null {
  const normalized = cmInput.trim().replace(",", ".")
  if (normalized === "") return null
  const cm = Number.parseFloat(normalized)
  if (!Number.isFinite(cm) || cm < 0) return null
  return Math.round(cm * MM_PER_CM)
}

export function medusaGToDisplayG(grams: number | null | undefined): string {
  if (grams === null || grams === undefined || !Number.isFinite(grams)) return ""
  return String(Math.round(grams))
}

export function displayGToMedusaG(gramsInput: string): number | null {
  const normalized = gramsInput.trim().replace(",", ".")
  if (normalized === "") return null
  const grams = Number.parseFloat(normalized)
  if (!Number.isFinite(grams) || grams < 0) return null
  return Math.round(grams)
}
