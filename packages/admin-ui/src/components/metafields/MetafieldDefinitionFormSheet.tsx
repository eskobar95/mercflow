import { type FormEvent, type ReactNode, useId, useState } from "react"

import { Button } from "@/components/ui/Button"
import { FormField } from "@/components/ui/FormField"
import { Input } from "@/components/ui/Input"
import { Select } from "@/components/ui/Select"
import { Sheet } from "@/components/ui/Sheet"
import { Switch } from "@/components/ui/Switch"
import { Textarea } from "@/components/ui/Textarea"
import { MetafieldDefinitionValidationsFields } from "@/components/metafields/MetafieldDefinitionValidationsFields"
import {
  buildValidationsPayload,
  EMPTY_VALIDATION_DRAFT,
  validationDraftFromRecord,
} from "@/features/metafields/metafieldValidations"
import { slugifyMetafieldKey } from "@/features/metafields/slugifyMetafieldKey"
import type {
  CreateMetafieldDefinitionPayload,
  MetafieldDefinitionDto,
  MetafieldOwnerType,
  MetafieldValueType,
  UpdateMetafieldDefinitionPayload,
} from "@/features/metafields/types"
import { metafieldValueTypeSelectOptions } from "@/features/metafields/valueTypeLabels"
import type { AdminProductCategoryHierarchyRow } from "@/features/product-categories/types"
import { useAdjustStateWhenKeyChanges } from "@/lib/react/useAdjustStateWhenKeyChanges"

type MetafieldDefinitionFormSheetProps = {
  open: boolean
  mode: "create" | "edit"
  ownerType: MetafieldOwnerType
  definition: MetafieldDefinitionDto | null
  requireCategoryConstraint: boolean
  defaultCategoryConstraintId?: string
  categoryRows: AdminProductCategoryHierarchyRow[]
  saving: boolean
  errorMessage: string | null
  onOpenChange: (open: boolean) => void
  onSubmitCreate: (payload: CreateMetafieldDefinitionPayload) => Promise<void>
  onSubmitUpdate: (id: string, payload: UpdateMetafieldDefinitionPayload) => Promise<void>
}

type FormState = {
  name: string
  namespace: string
  key: string
  keyManual: boolean
  description: string
  type: MetafieldValueType
  isPrimary: boolean
  isRequired: boolean
  pinnedPosition: string
  categoryConstraintId: string
  validations: typeof EMPTY_VALIDATION_DRAFT
}

function initialFormState(
  definition: MetafieldDefinitionDto | null,
  requireCategoryConstraint: boolean,
  defaultCategoryConstraintId?: string
): FormState {
  if (definition === null) {
    return {
      name: "",
      namespace: "custom",
      key: "",
      keyManual: false,
      description: "",
      type: "single_line_text",
      isPrimary: false,
      isRequired: false,
      pinnedPosition: "",
      categoryConstraintId:
        requireCategoryConstraint && defaultCategoryConstraintId
          ? defaultCategoryConstraintId
          : "",
      validations: { ...EMPTY_VALIDATION_DRAFT },
    }
  }

  return {
    name: definition.name,
    namespace: definition.namespace,
    key: definition.key,
    keyManual: true,
    description: definition.description ?? "",
    type: definition.type,
    isPrimary: definition.is_primary,
    isRequired: definition.is_required,
    pinnedPosition:
      definition.pinned_position !== null ? String(definition.pinned_position) : "",
    categoryConstraintId: definition.category_constraint_id ?? "",
    validations: validationDraftFromRecord(definition.type, definition.validations),
  }
}

export function MetafieldDefinitionFormSheet({
  open,
  mode,
  ownerType,
  definition,
  requireCategoryConstraint,
  defaultCategoryConstraintId,
  categoryRows,
  saving,
  errorMessage,
  onOpenChange,
  onSubmitCreate,
  onSubmitUpdate,
}: MetafieldDefinitionFormSheetProps): ReactNode {
  const formKey = `${mode}:${definition?.id ?? "new"}:${String(open)}`
  const [form, setForm] = useState<FormState>(() =>
    initialFormState(definition, requireCategoryConstraint, defaultCategoryConstraintId)
  )

  useAdjustStateWhenKeyChanges(formKey, () => {
    setForm(
      initialFormState(definition, requireCategoryConstraint, defaultCategoryConstraintId)
    )
  })

  const primaryId = useId()
  const requiredId = useId()
  const typeOptions = metafieldValueTypeSelectOptions().map((option) => ({
    value: option.value,
    label: option.label,
  }))
  const categoryOptions = categoryRows.map((row) => ({
    value: row.id,
    label: `${"— ".repeat(row.depth)}${row.name}`,
  }))

  const handleNameChange = (name: string): void => {
    setForm((prev) => {
      const nextKey = prev.keyManual ? prev.key : slugifyMetafieldKey(name)
      return { ...prev, name, key: nextKey }
    })
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    const pinned =
      form.pinnedPosition.trim() === ""
        ? null
        : Number.parseInt(form.pinnedPosition.trim(), 10)
    const validations = buildValidationsPayload(form.type, form.validations)
    const categoryConstraintId =
      requireCategoryConstraint || form.categoryConstraintId.trim() !== ""
        ? form.categoryConstraintId.trim() || null
        : null

    if (mode === "create") {
      await onSubmitCreate({
        owner_type: ownerType,
        namespace: form.namespace.trim(),
        key: form.key.trim(),
        name: form.name.trim(),
        description: form.description.trim() === "" ? null : form.description.trim(),
        type: form.type,
        validations,
        pinned_position: Number.isFinite(pinned ?? NaN) ? pinned : null,
        is_required: form.isRequired,
        is_primary: form.isPrimary,
        category_constraint_id: categoryConstraintId,
      })
      return
    }

    if (definition === null) {
      return
    }

    await onSubmitUpdate(definition.id, {
      name: form.name.trim(),
      description: form.description.trim() === "" ? null : form.description.trim(),
      type: form.type,
      validations,
      pinned_position: Number.isFinite(pinned ?? NaN) ? pinned : null,
      is_required: form.isRequired,
      is_primary: form.isPrimary,
      category_constraint_id: categoryConstraintId,
    })
  }

  const showCategoryField =
    ownerType === "product" && (requireCategoryConstraint || mode === "edit")

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={mode === "create" ? "Add definition" : "Edit definition"}
      description="Define a custom field merchants can fill on products or categories."
      footer={
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            disabled={saving}
            onClick={() => {
              onOpenChange(false)
            }}
          >
            Cancel
          </Button>
          <Button type="submit" form="metafield-definition-form" variant="primary" disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      }
    >
      <form id="metafield-definition-form" className="space-y-4" onSubmit={(e) => void handleSubmit(e)}>
        <FormField label="Name" required>
          <Input
            value={form.name}
            disabled={saving}
            onChange={(event) => {
              handleNameChange(event.target.value)
            }}
          />
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Namespace" required hint='Default is "custom"'>
            <Input
              value={form.namespace}
              disabled={saving || mode === "edit"}
              onChange={(event) => {
                setForm((prev) => ({ ...prev, namespace: event.target.value }))
              }}
            />
          </FormField>
          <FormField label="Key" required hint="Auto-generated from name; editable">
            <Input
              value={form.key}
              disabled={saving || mode === "edit"}
              onChange={(event) => {
                setForm((prev) => ({
                  ...prev,
                  key: event.target.value,
                  keyManual: true,
                }))
              }}
            />
          </FormField>
        </div>

        <FormField label="Description" hint="Optional helper text for merchants">
          <Textarea
            value={form.description}
            rows={2}
            disabled={saving}
            onChange={(event) => {
              setForm((prev) => ({ ...prev, description: event.target.value }))
            }}
          />
        </FormField>

        <FormField label="Type" required>
          <Select
            value={form.type}
            options={typeOptions}
            disabled={saving}
            onValueChange={(value) => {
              const nextType = value as MetafieldValueType
              setForm((prev) => ({
                ...prev,
                type: nextType,
                validations: validationDraftFromRecord(nextType, null),
              }))
            }}
          />
        </FormField>

        <MetafieldDefinitionValidationsFields
          type={form.type}
          draft={form.validations}
          disabled={saving}
          onChange={(validations) => {
            setForm((prev) => ({ ...prev, validations }))
          }}
        />

        {showCategoryField ? (
          <FormField
            label="Category constraint"
            required={requireCategoryConstraint}
            hint="Only products in this category see the field"
          >
            <Select
              value={form.categoryConstraintId}
              placeholder="Select category…"
              options={categoryOptions}
              disabled={saving}
              onValueChange={(value) => {
                setForm((prev) => ({ ...prev, categoryConstraintId: value }))
              }}
            />
          </FormField>
        ) : null}

        <FormField label="Pinned position" hint="Lower numbers appear first (optional)">
          <Input
            type="number"
            value={form.pinnedPosition}
            disabled={saving}
            onChange={(event) => {
              setForm((prev) => ({ ...prev, pinnedPosition: event.target.value }))
            }}
          />
        </FormField>

        <div className="space-y-3 rounded-md border border-border-subtle bg-surface-subtle p-3">
          <Switch
            id={primaryId}
            checked={form.isPrimary}
            disabled={saving}
            label="Primary field"
            onCheckedChange={(checked) => {
              setForm((prev) => ({ ...prev, isPrimary: checked }))
            }}
          />
          <p className="text-xs text-content-secondary">
            Primary fields are always visible on the product form. Others appear as expandable chips.
          </p>
          <Switch
            id={requiredId}
            checked={form.isRequired}
            disabled={saving}
            label="Required"
            onCheckedChange={(checked) => {
              setForm((prev) => ({ ...prev, isRequired: checked }))
            }}
          />
        </div>

        {errorMessage !== null ? (
          <p role="alert" className="text-sm text-content-danger">
            {errorMessage}
          </p>
        ) : null}
      </form>
    </Sheet>
  )
}
