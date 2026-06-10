export type VariantShippingDraft = {
  lengthCm: string
  widthCm: string
  heightCm: string
  weightG: string
}

export function emptyVariantShippingDraft(): VariantShippingDraft {
  return { lengthCm: "", widthCm: "", heightCm: "", weightG: "" }
}

export function variantShippingDraftsEqual(left: VariantShippingDraft, right: VariantShippingDraft): boolean {
  return left.lengthCm === right.lengthCm && left.widthCm === right.widthCm && left.heightCm === right.heightCm && left.weightG === right.weightG
}

function shippingDraftHasValues(draft: VariantShippingDraft): boolean {
  return [draft.lengthCm, draft.widthCm, draft.heightCm, draft.weightG].some((v) => v.trim() !== "")
}

export function countVariantsWithDistinctShippingDrafts(params: {
  shippingMap: Partial<Record<string, VariantShippingDraft>>
  comboKeys: string[]
  sourceComboKey: string
}): number {
  const source = params.shippingMap[params.sourceComboKey] ?? emptyVariantShippingDraft()
  let count = 0
  for (const comboKey of params.comboKeys) {
    if (comboKey === params.sourceComboKey) continue
    const candidate = params.shippingMap[comboKey] ?? emptyVariantShippingDraft()
    if (!shippingDraftHasValues(candidate)) continue
    if (!variantShippingDraftsEqual(source, candidate)) count += 1
  }
  return count
}
