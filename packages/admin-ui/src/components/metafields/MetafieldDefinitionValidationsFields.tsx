import type { ReactNode } from "react"

import { FormField } from "@/components/ui/FormField"
import { Input } from "@/components/ui/Input"
import type { MetafieldValidationDraft } from "@/features/metafields/metafieldValidations"
import {
  supportsMetafieldValidations,
} from "@/features/metafields/metafieldValidations"
import type { MetafieldValueType } from "@/features/metafields/types"

type MetafieldDefinitionValidationsFieldsProps = {
  type: MetafieldValueType
  draft: MetafieldValidationDraft
  disabled?: boolean
  onChange: (next: MetafieldValidationDraft) => void
}

export function MetafieldDefinitionValidationsFields({
  type,
  draft,
  disabled = false,
  onChange,
}: MetafieldDefinitionValidationsFieldsProps): ReactNode {
  if (!supportsMetafieldValidations(type)) {
    return (
      <p className="text-sm text-content-secondary">
        No extra validation rules for this type.
      </p>
    )
  }

  if (type === "single_line_text" || type === "multi_line_text") {
    return (
      <FormField label="Max length" hint="Optional character limit">
        <Input
          type="number"
          min={1}
          value={draft.max_length}
          disabled={disabled}
          onChange={(event) => {
            onChange({ ...draft, max_length: event.target.value })
          }}
        />
      </FormField>
    )
  }

  if (type === "number_integer" || type === "number_decimal") {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Minimum" hint="Optional">
          <Input
            type="number"
            value={draft.min}
            disabled={disabled}
            onChange={(event) => {
              onChange({ ...draft, min: event.target.value })
            }}
          />
        </FormField>
        <FormField label="Maximum" hint="Optional">
          <Input
            type="number"
            value={draft.max}
            disabled={disabled}
            onChange={(event) => {
              onChange({ ...draft, max: event.target.value })
            }}
          />
        </FormField>
      </div>
    )
  }

  return (
    <FormField label="Max items" hint="Optional list length limit">
      <Input
        type="number"
        min={1}
        value={draft.max_items}
        disabled={disabled}
        onChange={(event) => {
          onChange({ ...draft, max_items: event.target.value })
        }}
      />
    </FormField>
  )
}
