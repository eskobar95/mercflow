export function toIso(value: string | Date): string {
  if (value instanceof Date) {
    return value.toISOString()
  }
  return value
}
