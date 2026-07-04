import type { ReactNode } from "react"
import { useEffect, useState } from "react"

import { Checkbox } from "@/components/ui/Checkbox"
import { FormField } from "@/components/ui/FormField"
import { RadioGroup, RadioGroupItem } from "@/components/ui/RadioGroup"
import {
  listAdminCollections,
  type AdminCollectionRow,
} from "@/features/discounts/collectionsAdminApi"
import type { ProductScope } from "@/features/discounts/discountFormTypes"

import { DiscountProductPickerFields } from "./DiscountProductPickerFields"

type DiscountCatalogTargetingFieldsProps = {
  appliesTo: ProductScope
  collectionIds: string[]
  productIds: string[]
  onAppliesToChange: (value: ProductScope) => void
  onCollectionIdsChange: (ids: string[]) => void
  onProductIdsChange: (ids: string[]) => void
  disabled?: boolean
}

export function DiscountCatalogTargetingFields({
  appliesTo,
  collectionIds,
  productIds,
  onAppliesToChange,
  onCollectionIdsChange,
  onProductIdsChange,
  disabled = false,
}: DiscountCatalogTargetingFieldsProps): ReactNode {
  const [collections, setCollections] = useState<AdminCollectionRow[]>([])
  const [collectionsError, setCollectionsError] = useState<string | null>(null)
  const [loadingCollections, setLoadingCollections] = useState(false)

  useEffect(() => {
    if (appliesTo !== "collections") {
      return
    }

    let cancelled = false
    setLoadingCollections(true)
    setCollectionsError(null)

    void listAdminCollections()
      .then((rows) => {
        if (!cancelled) {
          setCollections(rows)
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setCollectionsError(
            error instanceof Error ? error.message : "Failed to load collections",
          )
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingCollections(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [appliesTo])

  const toggleCollection = (id: string, checked: boolean): void => {
    const nextIds = checked
      ? [...collectionIds, id]
      : collectionIds.filter((entry) => entry !== id)
    onCollectionIdsChange(nextIds)
  }

  return (
    <FormField label="Applies to" htmlFor="discount-applies-all">
      <div className="space-y-4">
        <RadioGroup
          value={appliesTo}
          disabled={disabled}
          onValueChange={(next) => {
            if (next === "all" || next === "collections" || next === "products") {
              onAppliesToChange(next)
            }
          }}
        >
          <RadioGroupItem id="discount-applies-all" value="all" label="All products" />
          <RadioGroupItem
            id="discount-applies-collections"
            value="collections"
            label="Specific collections"
          />
          <RadioGroupItem
            id="discount-applies-products"
            value="products"
            label="Specific products"
          />
        </RadioGroup>

        {appliesTo === "collections" ? (
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-content-primary">Select collections</legend>
            {loadingCollections ? (
              <p className="text-sm text-content-secondary">Loading collections…</p>
            ) : null}
            {collectionsError !== null ? (
              <p className="text-sm text-feedback-danger-content" role="alert">
                {collectionsError}
              </p>
            ) : null}
            {!loadingCollections && collections.length === 0 ? (
              <p className="text-sm text-content-secondary">No collections found in your catalog.</p>
            ) : null}
            {collections.map((collection) => (
              <Checkbox
                key={collection.id}
                id={`discount-collection-${collection.id}`}
                label={collection.title}
                checked={collectionIds.includes(collection.id)}
                disabled={disabled}
                onCheckedChange={(checked) => {
                  toggleCollection(collection.id, checked === true)
                }}
              />
            ))}
          </fieldset>
        ) : null}

        {appliesTo === "products" ? (
          <DiscountProductPickerFields
            productIds={productIds}
            disabled={disabled}
            onProductIdsChange={onProductIdsChange}
          />
        ) : null}
      </div>
    </FormField>
  )
}
