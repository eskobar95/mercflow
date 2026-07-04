import type { FormEvent, ReactNode } from "react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"

import { Card } from "@/components/ui/Card"
import { PageHeader } from "@/components/ui/PageHeader"
import { buildUpdateDiscountPayload } from "@/features/discounts/buildDiscountPayload"
import {
  getAdminDiscount,
  updateAdminDiscount,
} from "@/features/discounts/discountsApi"
import {
  mapDetailToOrderFormState,
  mapDetailToProductFormState,
} from "@/features/discounts/discountFormMappers"
import type {
  DiscountFormCoreState,
  OrderDiscountFormState,
  ProductDiscountFormState,
} from "@/features/discounts/discountFormTypes"
import type { AdminDiscountDetail } from "@/features/discounts/types"
import { resolveMedusaAdminBackendUrl } from "@/medusa-admin/medusaAdminFetch"

import { OrderDiscountForm } from "./OrderDiscountForm"
import { ProductDiscountForm, validateProductDiscountForm } from "./ProductDiscountForm"
import { discountTypeTitle, isDiscountTypeSupportedForForms } from "@/features/discounts/discountTypeLabels"

function DiscountEditBackendMissingNotice(): ReactNode {
  return (
    <div className="p-6 text-sm text-content-secondary">
      Configure{" "}
      <code className="rounded-sm bg-surface-subtle px-1 py-0.5 font-mono text-xs">
        VITE_MEDUSA_ADMIN_BACKEND_URL
      </code>{" "}
      to edit discounts.
    </div>
  )
}

function DiscountEditPageContent({ discountId }: { discountId: string }): ReactNode {
  const navigate = useNavigate()
  const [detail, setDetail] = useState<AdminDiscountDetail | null>(null)
  const [productForm, setProductForm] = useState<ProductDiscountFormState | null>(null)
  const [orderForm, setOrderForm] = useState<OrderDiscountFormState | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void (async (): Promise<void> => {
      setLoading(true)
      setError(null)
      try {
        const loaded = await getAdminDiscount(discountId)
        setDetail(loaded)
        if (loaded.discount_type === "product") {
          setProductForm(mapDetailToProductFormState(loaded))
        } else if (loaded.discount_type === "order") {
          setOrderForm(mapDetailToOrderFormState(loaded))
        }
      } catch (loadError: unknown) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load discount")
      } finally {
        setLoading(false)
      }
    })()
  }, [discountId])

  const breadcrumbs = useMemo(
    () => [
      { label: "Discounts", href: "/discounts" },
      { label: detail?.name ?? "Discount", href: `/discounts/${discountId}` },
      { label: "Edit" },
    ],
    [detail?.name, discountId],
  )

  const onSubmit = useCallback(
    async (event: FormEvent): Promise<void> => {
      event.preventDefault()
      if (detail === null) {
        return
      }

      const form =
        detail.discount_type === "product"
          ? productForm
          : detail.discount_type === "order"
            ? orderForm
            : null

      if (form === null) {
        return
      }

      if (detail.discount_type !== "product" && detail.discount_type !== "order") {
        return
      }

      if (detail.discount_type === "product") {
        const scopeError = validateProductDiscountForm(form as ProductDiscountFormState)
        if (scopeError !== null) {
          setError(scopeError)
          return
        }
      }

      const payload =
        detail.discount_type === "product"
          ? buildUpdateDiscountPayload("product", form as ProductDiscountFormState)
          : buildUpdateDiscountPayload("order", form as DiscountFormCoreState)
      if (payload === null) {
        setError("Check the form — name, value, code, and date fields must be valid.")
        return
      }

      setSaving(true)
      setError(null)
      try {
        const updated = await updateAdminDiscount(discountId, payload)
        navigate(`/discounts/${updated.id}`)
      } catch (submitError: unknown) {
        setError(submitError instanceof Error ? submitError.message : "Failed to update discount")
      } finally {
        setSaving(false)
      }
    },
    [detail, discountId, navigate, orderForm, productForm],
  )

  if (loading) {
    return (
      <div className="space-y-4 p-6">
        <div className="h-8 w-48 animate-pulse rounded-sm bg-surface-subtle" aria-hidden />
        <div className="h-64 animate-pulse rounded-lg bg-surface-subtle" aria-hidden />
      </div>
    )
  }

  if (error !== null && detail === null) {
    return (
      <div className="p-6">
        <Card compact className="border-feedback-danger-border bg-feedback-danger-subtle">
          <p className="text-sm text-feedback-danger-content">{error}</p>
          <Link
            to="/discounts"
            className="mt-4 inline-flex text-sm font-medium text-interactive-primary hover:text-interactive-primary-hover"
          >
            ← Back to discounts
          </Link>
        </Card>
      </div>
    )
  }

  if (detail === null) {
    return null
  }

  if (!isDiscountTypeSupportedForForms(detail.discount_type)) {
    return (
      <div className="flex min-h-full flex-col bg-surface-appCard">
        <PageHeader title={`Edit ${detail.name}`} breadcrumbs={breadcrumbs} />
        <div className="p-6">
          <Card compact>
            <p className="text-sm text-content-secondary">
              Editing {discountTypeTitle(detail.discount_type).toLowerCase()} discounts is not
              available yet.
            </p>
            <Link
              to={`/discounts/${discountId}`}
              className="mt-4 inline-flex text-sm font-medium text-interactive-primary hover:text-interactive-primary-hover"
            >
              ← Back to discount
            </Link>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-full flex-col bg-surface-appCard">
      <PageHeader title={`Edit ${detail.name}`} breadcrumbs={breadcrumbs} />

      <div className="mx-auto w-full max-w-3xl p-6">
        {detail.discount_type === "product" && productForm !== null ? (
          <ProductDiscountForm
            form={productForm}
            onChange={setProductForm}
            saving={saving}
            error={error}
            submitLabel="Save changes"
            onSubmit={(event) => {
              void onSubmit(event)
            }}
          />
        ) : null}

        {detail.discount_type === "order" && orderForm !== null ? (
          <OrderDiscountForm
            form={orderForm}
            onChange={setOrderForm}
            saving={saving}
            error={error}
            submitLabel="Save changes"
            onSubmit={(event) => {
              void onSubmit(event)
            }}
          />
        ) : null}
      </div>
    </div>
  )
}

export function DiscountEditPage(): ReactNode {
  const { id } = useParams<{ id: string }>()

  if (resolveMedusaAdminBackendUrl() === null) {
    return <DiscountEditBackendMissingNotice />
  }

  if (id === undefined || id.trim() === "") {
    return (
      <div className="p-6 text-sm text-content-secondary">
        Missing discount id — return to <Link to="/discounts">Discounts</Link>.
      </div>
    )
  }

  return <DiscountEditPageContent discountId={id} />
}
