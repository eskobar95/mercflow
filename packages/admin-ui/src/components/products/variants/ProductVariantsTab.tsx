import { type ReactNode, useState } from "react"

import type { AdminProduct } from "@medusajs/types"

import { EditorSection } from "@/components/products/editor/EditorSection"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"

import { AddVariantDialog } from "./AddVariantDialog"
import { VariantListTable } from "./VariantListTable"

type ProductVariantsTabProps = {
  product: AdminProduct
  productId: string
}

/**
 * Variants tab — option summary plus the variant list (rows deep-link to the
 * variant sub-page) and an "Add variant" action. Keeps the page scannable; deep
 * pricing/inventory lives on the sub-page.
 */
export function ProductVariantsTab({ product, productId }: ProductVariantsTabProps): ReactNode {
  const [addOpen, setAddOpen] = useState(false)
  const options = product.options ?? []
  const variants = product.variants ?? []

  return (
    <div className="space-y-4">
      {options.length > 0 ? (
        <EditorSection title="Options" description="The dimensions variants are built from.">
          <div className="space-y-3">
            {options.map((option) => (
              <div key={option.id ?? option.title}>
                <p className="mb-1.5 text-xs font-medium text-content-secondary">{option.title}</p>
                <div className="flex flex-wrap gap-1.5">
                  {(option.values ?? []).map((value) => (
                    <Badge key={value.id ?? value.value} variant="neutral">
                      {value.value ?? "—"}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </EditorSection>
      ) : null}

      <EditorSection
        title="Variants"
        description={`${variants.length} variant${variants.length === 1 ? "" : "s"}.`}
        action={
          <Button variant="secondary" size="sm" onClick={() => setAddOpen(true)}>
            Add variant
          </Button>
        }
      >
        {variants.length === 0 ? (
          <p className="text-sm text-content-secondary">No variants yet. Add one to start selling.</p>
        ) : (
          <VariantListTable product={product} productId={productId} />
        )}
      </EditorSection>

      <AddVariantDialog open={addOpen} onOpenChange={setAddOpen} product={product} productId={productId} />
    </div>
  )
}
