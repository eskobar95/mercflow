import type { ReactNode } from "react"

import { EditorSection } from "@/components/products/editor/EditorSection"
import type { ProductEditorDraft } from "@/components/products/editor/productEditorTypes"
import { useProductEditorOptions } from "@/components/products/editor/useProductEditorOptions"
import { FormField } from "@/components/ui/FormField"
import { Select } from "@/components/ui/Select"

import { CategoryPickerField } from "./CategoryPickerField"
import { TagTokenField } from "./TagTokenField"

type Props = {
  draft: ProductEditorDraft
  update: (patch: Partial<ProductEditorDraft>) => void
}

const NONE = "__none__"

export function ProductOrganizationCard({ draft, update }: Props): ReactNode {
  const options = useProductEditorOptions()

  return (
    <EditorSection title="Organization" description="Group the product so staff and storefront can find it.">
      <FormField label="Collection">
        <Select
          value={draft.collectionId ?? NONE}
          onValueChange={(value) => update({ collectionId: value === NONE ? null : value })}
          options={[{ value: NONE, label: "No collection" }, ...options.collections]}
          aria-label="Collection"
        />
      </FormField>

      <FormField label="Type">
        <Select
          value={draft.typeId ?? NONE}
          onValueChange={(value) => update({ typeId: value === NONE ? null : value })}
          options={[{ value: NONE, label: "No type" }, ...options.types]}
          aria-label="Product type"
        />
      </FormField>

      <FormField label="Categories">
        <CategoryPickerField
          options={options.categories}
          selectedIds={draft.categoryIds}
          onChange={(ids) => update({ categoryIds: ids })}
        />
      </FormField>

      <FormField label="Tags">
        <TagTokenField tags={draft.tags} onChange={(tags) => update({ tags })} />
      </FormField>
    </EditorSection>
  )
}
