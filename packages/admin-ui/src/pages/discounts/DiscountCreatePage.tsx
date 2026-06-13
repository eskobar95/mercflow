import type { FormEvent, ReactNode } from "react"
import { useCallback, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"

import { Card } from "@/components/ui/Card"
import { PageHeader } from "@/components/ui/PageHeader"
import { buildCreateDiscountPayload } from "@/features/discounts/buildDiscountPayload"
import { createAdminDiscount } from "@/features/discounts/discountsApi"
import {
  createDefaultOrderDiscountFormState,
  createDefaultProductDiscountFormState,
  isBuyGetOrFreeShippingType,
  type DiscountFormType,
  type OrderDiscountFormState,
  type ProductDiscountFormState,
} from "@/features/discounts/discountFormTypes"
import { resolveMedusaAdminBackendUrl } from "@/medusa-admin/medusaAdminFetch"

import { BuyXGetYForm } from "./BuyXGetYForm"
import { DiscountTypeSelector } from "./DiscountTypeSelector"
import {
  discountTypeTitle,
  isDiscountTypeSupportedForForms,
} from "@/features/discounts/discountTypeLabels"
import { FreeShippingForm } from "./FreeShippingForm"
import { OrderDiscountForm } from "./OrderDiscountForm"
import { ProductDiscountForm } from "./ProductDiscountForm"

function DiscountCreateBackendMissingNotice(): ReactNode {
  return (
    <div className="p-6 text-sm text-content-secondary">
      Configure{" "}
      <code className="rounded-sm bg-surface-subtle px-1 py-0.5 font-mono text-xs">
        VITE_MEDUSA_ADMIN_BACKEND_URL
      </code>{" "}
      to create discounts.
    </div>
  )
}

function DiscountCreatePageContent(): ReactNode {
  const navigate = useNavigate()
  const [selectedType, setSelectedType] = useState<DiscountFormType | null>(null)
  const [productForm, setProductForm] = useState<ProductDiscountFormState>(
    createDefaultProductDiscountFormState(),
  )
  const [orderForm, setOrderForm] = useState<OrderDiscountFormState>(
    createDefaultOrderDiscountFormState(),
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const breadcrumbs = useMemo(
    () => [
      { label: "Discounts", href: "/discounts" },
      { label: "Create discount" },
    ],
    [],
  )

  const onSubmit = useCallback(
    async (event: FormEvent, type: "product" | "order"): Promise<void> => {
      event.preventDefault()
      const form = type === "product" ? productForm : orderForm
      const payload = buildCreateDiscountPayload(type, form, { status: "draft" })
      if (payload === null) {
        setError("Check the form — name, value, code, and date fields must be valid.")
        return
      }

      setSaving(true)
      setError(null)
      try {
        const created = await createAdminDiscount(payload)
        navigate(`/discounts/${created.id}`)
      } catch (submitError: unknown) {
        setError(submitError instanceof Error ? submitError.message : "Failed to create discount")
      } finally {
        setSaving(false)
      }
    },
    [navigate, orderForm, productForm],
  )

  return (
    <div className="flex min-h-full flex-col bg-surface-appCard">
      <PageHeader
        title={selectedType === null ? "Create discount" : discountTypeTitle(selectedType)}
        description={
          selectedType === null
            ? "Choose a discount type to get started."
            : "Configure value, method, and conditions."
        }
        breadcrumbs={breadcrumbs}
        actions={
          selectedType !== null ? (
            <button
              type="button"
              className="text-sm font-medium text-interactive-primary hover:text-interactive-primary-hover"
              onClick={() => {
                setSelectedType(null)
                setError(null)
              }}
            >
              Change type
            </button>
          ) : (
            <Link
              to="/discounts"
              className="text-sm font-medium text-interactive-primary hover:text-interactive-primary-hover"
            >
              ← Discounts
            </Link>
          )
        }
      />

      <div className="mx-auto w-full max-w-3xl space-y-6 p-6">
        {selectedType === null ? (
          <DiscountTypeSelector selectedType={selectedType} onSelect={setSelectedType} />
        ) : null}

        {selectedType === "product" ? (
          <ProductDiscountForm
            form={productForm}
            onChange={setProductForm}
            saving={saving}
            error={error}
            submitLabel="Save discount"
            onSubmit={(event) => {
              void onSubmit(event, "product")
            }}
          />
        ) : null}

        {selectedType === "order" ? (
          <OrderDiscountForm
            form={orderForm}
            onChange={setOrderForm}
            saving={saving}
            error={error}
            submitLabel="Save discount"
            onSubmit={(event) => {
              void onSubmit(event, "order")
            }}
          />
        ) : null}

        {selectedType === "buyget" ? (
          <BuyXGetYForm
            onCreated={(discountId) => {
              navigate(`/discounts/${encodeURIComponent(discountId)}`)
            }}
          />
        ) : null}

        {selectedType === "free_shipping" ? (
          <FreeShippingForm
            onCreated={(discountId) => {
              navigate(`/discounts/${encodeURIComponent(discountId)}`)
            }}
          />
        ) : null}

        {selectedType !== null &&
        !isDiscountTypeSupportedForForms(selectedType) &&
        !isBuyGetOrFreeShippingType(selectedType) ? (
          <Card compact>
            <h2 className="text-base font-semibold text-content-primary">
              {discountTypeTitle(selectedType)}
            </h2>
            <p className="mt-2 text-sm text-content-secondary">
              This discount type is not available yet. Product and order discounts can be created
              today; buy X get Y and free shipping forms are coming in the next release.
            </p>
            <button
              type="button"
              className="mt-4 text-sm font-medium text-interactive-primary hover:text-interactive-primary-hover"
              onClick={() => {
                setSelectedType(null)
              }}
            >
              ← Choose another type
            </button>
          </Card>
        ) : null}
      </div>
    </div>
  )
}

export function DiscountCreatePage(): ReactNode {
  if (resolveMedusaAdminBackendUrl() === null) {
    return <DiscountCreateBackendMissingNotice />
  }

  return <DiscountCreatePageContent />
}
