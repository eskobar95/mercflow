import { MedusaError } from "@medusajs/utils"

import type { VariantDimensions } from "../../modules/packaging/types"

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function toPositiveInt(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null
  }
  const rounded = Math.round(value)
  return rounded > 0 ? rounded : null
}

export function variantRowToDimensions(row: Record<string, unknown>): VariantDimensions | null {
  const length_mm = toPositiveInt(row.length)
  const width_mm = toPositiveInt(row.width)
  const height_mm = toPositiveInt(row.height)
  const weight_g = toPositiveInt(row.weight)

  if (length_mm === null || width_mm === null || height_mm === null || weight_g === null) {
    return null
  }

  return { length_mm, width_mm, height_mm, weight_g }
}

type RemoteQueryGraph = {
  graph: (input: {
    entity: string
    fields: string[]
    filters?: Record<string, unknown>
  }) => Promise<{ data: unknown[] }>
}

export function createVariantDimensionLoader(
  query: RemoteQueryGraph
): (variantIds: string[]) => Promise<Map<string, VariantDimensions>> {
  return async (variantIds: string[]): Promise<Map<string, VariantDimensions>> => {
    if (variantIds.length === 0) {
      return new Map()
    }

    const { data } = await query.graph({
      entity: "variant",
      fields: ["id", "length", "width", "height", "weight"],
      filters: { id: variantIds },
    })

    const map = new Map<string, VariantDimensions>()
    for (const entry of data) {
      if (!isRecord(entry) || typeof entry.id !== "string") {
        continue
      }
      const dimensions = variantRowToDimensions(entry)
      if (!dimensions) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Product variant "${entry.id}" is missing shipping dimensions or weight`
        )
      }
      map.set(entry.id, dimensions)
    }

    return map
  }
}
