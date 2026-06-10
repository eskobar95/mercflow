import { type ReactNode } from "react"

import { Checkbox } from "@/components/ui/Checkbox"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"
import { Textarea } from "@/components/ui/Textarea"
import type { MetafieldValueType } from "@/features/metafields/types"

type MetafieldValueFieldProps = {
  id: string
  name: string
  description: string | null
  type: MetafieldValueType
  required: boolean
  draft: string
  error?: string | null
  disabled?: boolean
  onDraftChange: (next: string) => void
}

function inputTypeForMetafield(type: MetafieldValueType): string {
  switch (type) {
    case "number_integer":
    case "number_decimal":
      return "number"
    case "url":
      return "url"
    case "color":
      return "color"
    case "date":
      return "date"
    case "date_time":
      return "datetime-local"
    default:
      return "text"
  }
}

export function MetafieldValueField({
  id,
  name,
  description,
  type,
  required,
  draft,
  error = null,
  disabled = false,
  onDraftChange,
}: MetafieldValueFieldProps): ReactNode {
  const fieldId = `metafield-${id}`
  const hasError = error !== null && error.length > 0

  let control: ReactNode

  if (type === "boolean") {
    const checked = draft === "true"
    control = (
      <div className="flex items-center gap-2">
        <Checkbox
          id={fieldId}
          checked={checked}
          disabled={disabled}
          onCheckedChange={(next) => {
            onDraftChange(next === true ? "true" : "false")
          }}
        />
        <Label htmlFor={fieldId} className="font-normal text-content-secondary">
          {checked ? "Yes" : "No"}
        </Label>
      </div>
    )
  } else if (
    type === "multi_line_text" ||
    type === "list.single_line_text" ||
    type === "json" ||
    type === "rich_text"
  ) {
    control = (
      <Textarea
        id={fieldId}
        value={draft}
        disabled={disabled}
        error={hasError}
        rows={4}
        placeholder={
          type === "list.single_line_text"
            ? "One item per line"
            : type === "json" || type === "rich_text"
              ? '{"type":"doc","content":[]}'
              : undefined
        }
        onChange={(event) => {
          onDraftChange(event.target.value)
        }}
      />
    )
  } else if (
    type === "single_line_text" ||
    type === "url" ||
    type === "color" ||
    type === "date" ||
    type === "date_time" ||
    type === "number_integer" ||
    type === "number_decimal"
  ) {
    control = (
      <Input
        id={fieldId}
        type={inputTypeForMetafield(type)}
        value={draft}
        disabled={disabled}
        error={hasError}
        step={type === "number_decimal" ? "any" : type === "number_integer" ? "1" : undefined}
        onChange={(event) => {
          onDraftChange(event.target.value)
        }}
      />
    )
  } else {
    control = (
      <Input
        id={fieldId}
        type="text"
        value={draft}
        disabled={disabled}
        error={hasError}
        placeholder="Comma-separated numbers"
        onChange={(event) => {
          onDraftChange(event.target.value)
        }}
      />
    )
  }

  return (
    <div className="space-y-1.5">
      <Label htmlFor={fieldId} required={required}>
        {name}
      </Label>
      {description ? (
        <p className="text-xs text-content-tertiary">{description}</p>
      ) : null}
      {control}
      {hasError ? (
        <p className="text-xs text-status-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
