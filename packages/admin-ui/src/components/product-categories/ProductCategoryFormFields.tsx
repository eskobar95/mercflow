import type { FormEvent, ReactNode } from "react"
import { useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/Button"
import { FormField } from "@/components/ui/FormField"
import { Input } from "@/components/ui/Input"
import type { SelectOption } from "@/components/ui/Select"
import { Select } from "@/components/ui/Select"
import { Switch } from "@/components/ui/Switch"
import type { SlugStrategy } from "@/features/seo/types"
import { slugifyCategoryHandle } from "@/features/product-categories/slugifyCategoryHandle"

type ProductCategoryFormFieldsProps = {
  mode: "create" | "edit"
  name: string
  handle: string
  parentSelectValue: string
  isActive: boolean
  submitting: boolean
  formError: string | null
  parentSelectOptions: SelectOption[]
  parentOptionsLoading: boolean
  slugStrategy: SlugStrategy
  onNameChange: (value: string) => void
  onHandleManualChange: (value: string) => void
  onParentSelectChange: (value: string) => void
  onIsActiveChange: (value: boolean) => void
  onSubmit: (e: FormEvent<HTMLFormElement>) => Promise<void>
}

export function ProductCategoryFormFields({
  mode,
  name,
  handle,
  parentSelectValue,
  isActive,
  submitting,
  formError,
  parentSelectOptions,
  parentOptionsLoading,
  slugStrategy,
  onNameChange,
  onHandleManualChange,
  onParentSelectChange,
  onIsActiveChange,
  onSubmit,
}: ProductCategoryFormFieldsProps): ReactNode {
  const navigate = useNavigate()

  return (
    <form className="mt-4 space-y-4" onSubmit={(ev) => void onSubmit(ev)} noValidate>
      <FormField label="Name" required>
        <Input
          name="name"
          autoComplete="off"
          value={name}
          onChange={(ev) => {
            onNameChange(ev.target.value)
          }}
          disabled={submitting}
          placeholder="e.g. Outerwear"
        />
      </FormField>

      <FormField
        label="Handle"
        hint="Generated from the name until you edit it. Use lowercase hyphenated slugs."
        required
      >
        <Input
          name="handle"
          autoComplete="off"
          value={handle}
          onChange={(ev) => {
            onHandleManualChange(ev.target.value)
          }}
          disabled={submitting}
          placeholder={slugifyCategoryHandle(name, slugStrategy) || "category-handle"}
        />
      </FormField>

      <div>
        <FormField label="Parent category">
          <Select
            value={parentSelectValue}
            onValueChange={(v): void => {
              onParentSelectChange(v)
            }}
            placeholder="Choose parent…"
            options={parentSelectOptions}
            disabled={
              submitting || parentOptionsLoading || parentSelectOptions.length === 0
            }
            aria-label="Parent category"
          />
        </FormField>
        {parentOptionsLoading ? (
          <p className="mt-1 text-xs text-content-tertiary">
            Loading categories for tree order…
          </p>
        ) : null}
      </div>

      <Switch
        label="Active in storefront"
        checked={isActive}
        onCheckedChange={(v: boolean): void => {
          onIsActiveChange(v)
        }}
        disabled={submitting}
      />

      {formError ? (
        <p className="text-sm text-feedback-danger-content" role="alert">
          {formError}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2 pt-2">
        <Button type="submit" variant="primary" disabled={submitting || parentOptionsLoading}>
          {submitting ? "Saving…" : mode === "create" ? "Create category" : "Save changes"}
        </Button>
        {mode === "create" ? (
          <Button
            type="button"
            variant="secondary"
            disabled={submitting}
            onClick={() => {
              navigate("/product-categories")
            }}
          >
            Cancel
          </Button>
        ) : null}
      </div>
    </form>
  )
}
