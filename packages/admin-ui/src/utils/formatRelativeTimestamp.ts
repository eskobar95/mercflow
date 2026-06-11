const MINUTE_MS = 60_000
const HOUR_MS = 3_600_000
const DAY_MS = 86_400_000

/** Human-readable relative time for list timestamps. */
export function formatRelativeTimestamp(iso: string | null, now: Date = new Date()): string {
  if (iso === null || iso.trim() === "") {
    return "—"
  }
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) {
    return "—"
  }
  const diffMs = date.getTime() - now.getTime()
  const absMs = Math.abs(diffMs)
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" })

  if (absMs < MINUTE_MS) {
    return rtf.format(Math.round(diffMs / 1_000), "second")
  }
  if (absMs < HOUR_MS) {
    return rtf.format(Math.round(diffMs / MINUTE_MS), "minute")
  }
  if (absMs < DAY_MS) {
    return rtf.format(Math.round(diffMs / HOUR_MS), "hour")
  }
  if (absMs < DAY_MS * 7) {
    return rtf.format(Math.round(diffMs / DAY_MS), "day")
  }

  return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
}
