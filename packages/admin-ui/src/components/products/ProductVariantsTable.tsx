import type { ReactNode } from "react"
import { DataTable } from "@/components/ui/list/DataTable"
import type { ListColumnDef } from "@/components/ui/list/types"

import type { DetailVariantRow } from "@/hooks/products/useAdminProductDetail"

type Col = keyof Pick<DetailVariantRow, "name" | "priceLabel" | "stockLabel">

const columns: ListColumnDef<DetailVariantRow, Col>[] = [
  {
    id: "name",
    header: "Variant",
    sortable: false,
    renderCell: (r): ReactNode => (
      <div>
        <p className="text-sm font-medium text-content-primary">{r.name}</p>
        <p className="font-mono text-2xs text-content-tertiary">{r.skuLabel}</p>
      </div>
    ),
  },
  {
    id: "priceLabel",
    header: "Price",
    sortable: false,
    cellClassName: "text-sm tabular-nums text-content-secondary",
    renderCell: (r): string => r.priceLabel,
  },
  {
    id: "stockLabel",
    header: "Stock",
    sortable: false,
    cellClassName: "text-sm tabular-nums text-content-secondary",
    renderCell: (r): string => r.stockLabel,
  },
]

export function ProductVariantsTable({ variants }: { variants: DetailVariantRow[] }): ReactNode {
  return (
    <div className="rounded-md border border-border-subtle">
      <DataTable<DetailVariantRow, Col>
        caption="Variants and inventory"
        aria-label="Variants with price and inventory"
        columns={columns}
        data={variants}
        sortState={{ column: null, direction: "none" }}
        getRowId={(row) => row.id}
        onRequestSort={() => {}}
        hasRowActions={false}
        emptyState={
          <p className="px-4 py-6 text-center text-sm text-content-tertiary">
            No variants for this product.
          </p>
        }
      />
    </div>
  )
}
