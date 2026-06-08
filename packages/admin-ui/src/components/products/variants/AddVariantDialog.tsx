import { type ReactNode, useMemo, useState } from "react"

import type { AdminProduct } from "@medusajs/types"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import { Button } from "@/components/ui/Button"
import { DialogShell } from "@/components/ui/Dialog"
import { FormField } from "@/components/ui/FormField"
import { Input } from "@/components/ui/Input"
import { Select } from "@/components/ui/Select"
import { useToast } from "@/components/ui/Toast"
import { ADMIN_PRODUCT_EDITOR_FIELDS } from "@/lib/products/adminProductEditorFields"
import { extractMessageFromMedusaError } from "@/lib/products/productUnifiedPersistence"
import { createMercflowMedusaSdk } from "@/medusa-admin/createMercflowMedusaSdk"

type AddVariantDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: AdminProduct
  productId: string
}

type OptionDef = { title: string; values: string[] }

/**
 * Creates a variant by choosing a value per option. Persists with `batchVariants`
 * (create) then refreshes the list; price/stock are set on the variant sub-page.
 */
export function AddVariantDialog({ open, onOpenChange, product, productId }: AddVariantDialogProps): ReactNode {
  const sdk = useMemo(() => createMercflowMedusaSdk(), [])
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [selections, setSelections] = useState<Record<string, string>>({})

  const optionDefs = useMemo<OptionDef[]>(() => {
    return (product.options ?? [])
      .filter((option): option is typeof option & { title: string } => typeof option.title === "string")
      .map((option) => ({
        title: option.title,
        values: (option.values ?? [])
          .map((value) => value.value)
          .filter((value): value is string => typeof value === "string" && value.trim() !== ""),
      }))
  }, [product.options])

  const allChosen = optionDefs.every((def) => (selections[def.title] ?? "").trim() !== "")

  const createMutation = useMutation({
    mutationFn: async (): Promise<void> => {
      if (sdk === null) {
        throw new Error("Medusa Admin backend URL is not configured.")
      }
      const title = optionDefs.map((def) => `${def.title}: ${selections[def.title]}`).join(" · ")
      await sdk.admin.product.batchVariants(
        productId,
        {
          create: [
            {
              title: title === "" ? "New variant" : title,
              options: selections,
              prices: [{ currency_code: "dkk", amount: 0 }],
            },
          ],
        },
        { fields: ADMIN_PRODUCT_EDITOR_FIELDS },
      )
      await queryClient.invalidateQueries({ queryKey: ["admin-product-detail", productId] })
    },
    onSuccess: () => {
      toast({ variant: "success", title: "Variant added", description: "Set its price and stock to finish." })
      setSelections({})
      onOpenChange(false)
    },
    onError: (error: unknown) => {
      toast({ variant: "error", title: "Could not add variant", description: extractMessageFromMedusaError(error) })
    },
  })

  return (
    <DialogShell
      open={open}
      onOpenChange={onOpenChange}
      title="Add variant"
      description="Pick a value for each option. Price and stock are set on the next screen."
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            disabled={!allChosen || createMutation.isPending}
            onClick={() => {
              void createMutation.mutateAsync()
            }}
          >
            {createMutation.isPending ? "Adding…" : "Add variant"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {optionDefs.length === 0 ? (
          <p className="text-sm text-content-secondary">This product has no options to combine.</p>
        ) : (
          optionDefs.map((def) => (
            <FormField key={def.title} label={def.title}>
              {def.values.length > 0 ? (
                <Select
                  value={selections[def.title] ?? ""}
                  onValueChange={(value) => setSelections((previous) => ({ ...previous, [def.title]: value }))}
                  options={def.values.map((value) => ({ value, label: value }))}
                  placeholder={`Choose ${def.title.toLowerCase()}…`}
                  aria-label={def.title}
                />
              ) : (
                <Input
                  value={selections[def.title] ?? ""}
                  onChange={(event) => setSelections((previous) => ({ ...previous, [def.title]: event.target.value }))}
                  placeholder={`Enter ${def.title.toLowerCase()}`}
                />
              )}
            </FormField>
          ))
        )}
      </div>
    </DialogShell>
  )
}
