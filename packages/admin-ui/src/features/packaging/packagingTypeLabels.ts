import type { PackagingTypeKind } from "./types"

const LABELS: Record<PackagingTypeKind, string> = {
  box: "Box",
  envelope: "Envelope",
  bag: "Bag",
  tube: "Tube",
  other: "Other",
}

export function labelForPackagingType(kind: PackagingTypeKind): string {
  return LABELS[kind]
}

export const packagingTypeSelectOptions = (
  Object.entries(LABELS) as [PackagingTypeKind, string][]
).map(([value, label]) => ({ value, label }))
