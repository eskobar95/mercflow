import type { ReactNode } from "react"

import { EditorSection } from "@/components/products/editor/EditorSection"
import type { VariantEditorDraft } from "@/components/products/variants/useVariantEditor"
import { FormField } from "@/components/ui/FormField"
import { Input } from "@/components/ui/Input"
import { Switch } from "@/components/ui/Switch"

type Props = {
  draft: VariantEditorDraft
  update: (patch: Partial<VariantEditorDraft>) => void
}

export function VariantInventorySection({ draft, update }: Props): ReactNode {
  const manageId = "variant-manage-inventory"
  const backorderId = "variant-allow-backorder"

  return (
    <EditorSection title="Inventory">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <label htmlFor={manageId} className="text-sm font-medium text-content-primary">
            Track quantity
          </label>
          <p className="mt-0.5 text-xs text-content-tertiary">Let Medusa manage stock for this variant.</p>
        </div>
        <Switch
          id={manageId}
          checked={draft.manageInventory}
          onCheckedChange={(checked) => update({ manageInventory: checked })}
        />
      </div>

      {draft.manageInventory ? (
        <>
          <FormField label="Quantity in stock" hint="Stock at the primary location.">
            <Input
              value={draft.stock}
              onChange={(event) => update({ stock: event.target.value })}
              inputMode="numeric"
              placeholder="0"
            />
          </FormField>

          <div className="flex items-start justify-between gap-3 border-t border-border-subtle pt-4">
            <div className="min-w-0">
              <label htmlFor={backorderId} className="text-sm font-medium text-content-primary">
                Allow backorder
              </label>
              <p className="mt-0.5 text-xs text-content-tertiary">Keep selling when out of stock.</p>
            </div>
            <Switch
              id={backorderId}
              checked={draft.allowBackorder}
              onCheckedChange={(checked) => update({ allowBackorder: checked })}
            />
          </div>
        </>
      ) : null}
    </EditorSection>
  )
}
