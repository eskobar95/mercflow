import type { FormEvent } from "react"
import { type ReactNode, useCallback, useEffect, useReducer } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"

import { Button } from "@/components/ui/Button"
import { FormField } from "@/components/ui/FormField"
import { Input } from "@/components/ui/Input"
import { PageHeader } from "@/components/ui/PageHeader"
import {
  createSupplierAdmin,
  listSuppliersAdmin,
  updateSupplierAdmin,
} from "@/features/inventory/suppliersAdminApi"
import { resolveMedusaAdminBackendUrl } from "@/medusa-admin/medusaAdminFetch"

function MissingBackendConfigMessage(): ReactNode {
  return (
    <p className="mt-6 text-sm text-text-secondary">
      Configure{" "}
      <code className="rounded bg-surface-subtle px-1">VITE_MEDUSA_ADMIN_BACKEND_URL</code>{" "}
      to load and save suppliers.
    </p>
  )
}

type SupplierFormState = {
  name: string
  contactPerson: string
  email: string
  country: string
  currency: string
  loading: boolean
  saving: boolean
  error: string | null
}

type SupplierFormAction =
  | { type: "setName"; value: string }
  | { type: "setContactPerson"; value: string }
  | { type: "setEmail"; value: string }
  | { type: "setCountry"; value: string }
  | { type: "setCurrency"; value: string }
  | { type: "loadStart" }
  | { type: "loadFinish" }
  | { type: "loadSuccess"; payload: Pick<SupplierFormState, "name" | "contactPerson" | "email" | "country" | "currency"> }
  | { type: "setError"; message: string | null }
  | { type: "saveStart" }
  | { type: "saveFinish" }

function supplierFormReducer(state: SupplierFormState, action: SupplierFormAction): SupplierFormState {
  switch (action.type) {
    case "setName":
      return { ...state, name: action.value }
    case "setContactPerson":
      return { ...state, contactPerson: action.value }
    case "setEmail":
      return { ...state, email: action.value }
    case "setCountry":
      return { ...state, country: action.value }
    case "setCurrency":
      return { ...state, currency: action.value }
    case "loadStart":
      return { ...state, loading: true, error: null }
    case "loadFinish":
      return { ...state, loading: false }
    case "loadSuccess":
      return { ...state, ...action.payload }
    case "setError":
      return { ...state, error: action.message }
    case "saveStart":
      return { ...state, saving: true, error: null }
    case "saveFinish":
      return { ...state, saving: false }
    default:
      return state
  }
}

function createInitialSupplierFormState(isCreate: boolean, hasBackend: boolean): SupplierFormState {
  return {
    name: "",
    contactPerson: "",
    email: "",
    country: "",
    currency: "",
    loading: !isCreate && hasBackend,
    saving: false,
    error: null,
  }
}

export function SupplierFormPage(): ReactNode {
  const { supplierId } = useParams<{ supplierId: string }>()
  const navigate = useNavigate()
  const isCreate = supplierId === undefined || supplierId === "new"
  const hasBackend = resolveMedusaAdminBackendUrl() !== null

  const [form, dispatch] = useReducer(
    supplierFormReducer,
    { isCreate, hasBackend },
    ({ isCreate: create, hasBackend: backend }) => createInitialSupplierFormState(create, backend),
  )
  const { name, contactPerson, email, country, currency, loading, saving, error } = form

  useEffect(() => {
    if (isCreate || !hasBackend || !supplierId) {
      if (!isCreate) {
        dispatch({ type: "loadFinish" })
      }
      return
    }
    void (async (): Promise<void> => {
      dispatch({ type: "loadStart" })
      try {
        const rows = await listSuppliersAdmin()
        const row = rows.find((r) => r.id === supplierId)
        if (!row) {
          dispatch({ type: "setError", message: "Supplier not found" })
          return
        }
        dispatch({
          type: "loadSuccess",
          payload: {
            name: row.name,
            contactPerson: row.contact_person ?? "",
            email: row.email ?? "",
            country: row.country ?? "",
            currency: row.currency ?? "",
          },
        })
      } catch (e) {
        dispatch({
          type: "setError",
          message: e instanceof Error ? e.message : "Failed to load supplier",
        })
      } finally {
        dispatch({ type: "loadFinish" })
      }
    })()
  }, [hasBackend, isCreate, supplierId])

  const onSubmit = useCallback(
    async (event: FormEvent): Promise<void> => {
      event.preventDefault()
      if (!hasBackend) {
        dispatch({ type: "setError", message: "Backend URL is not configured" })
        return
      }
      dispatch({ type: "saveStart" })
      const payload = {
        name,
        contact_person: contactPerson.trim() === "" ? null : contactPerson.trim(),
        email: email.trim() === "" ? null : email.trim(),
        country: country.trim() === "" ? null : country.trim(),
        currency: currency.trim() === "" ? null : currency.trim(),
      }
      try {
        if (isCreate) {
          const created = await createSupplierAdmin(payload)
          navigate(`/inventory/suppliers/${encodeURIComponent(created.id)}`)
        } else if (supplierId) {
          await updateSupplierAdmin(supplierId, payload)
          navigate("/inventory/suppliers")
        }
      } catch (e) {
        dispatch({
          type: "setError",
          message: e instanceof Error ? e.message : "Save failed",
        })
      } finally {
        dispatch({ type: "saveFinish" })
      }
    },
    [
      contactPerson,
      country,
      currency,
      email,
      hasBackend,
      isCreate,
      name,
      navigate,
      supplierId,
    ]
  )

  return (
    <div className="p-6">
      <PageHeader
        title={isCreate ? "New supplier" : "Edit supplier"}
        description="Contact details used on purchase orders."
      />
      {!hasBackend ? (
        <MissingBackendConfigMessage />
      ) : loading ? (
        <p className="mt-6 text-sm text-content-secondary">Loading…</p>
      ) : (
        <form onSubmit={(e) => void onSubmit(e)} className="mx-auto mt-6 max-w-lg space-y-4">
          <FormField label="Name" htmlFor="supplier-name" required>
            <Input
              id="supplier-name"
              value={name}
              onChange={(e) => dispatch({ type: "setName", value: e.target.value })}
              required
            />
          </FormField>
          <FormField label="Contact person" htmlFor="supplier-contact">
            <Input
              id="supplier-contact"
              value={contactPerson}
              onChange={(e) => dispatch({ type: "setContactPerson", value: e.target.value })}
            />
          </FormField>
          <FormField label="Email" htmlFor="supplier-email">
            <Input
              id="supplier-email"
              type="email"
              value={email}
              onChange={(e) => dispatch({ type: "setEmail", value: e.target.value })}
            />
          </FormField>
          <FormField label="Country" htmlFor="supplier-country">
            <Input
              id="supplier-country"
              value={country}
              onChange={(e) => dispatch({ type: "setCountry", value: e.target.value })}
            />
          </FormField>
          <FormField label="Currency" htmlFor="supplier-currency">
            <Input
              id="supplier-currency"
              value={currency}
              onChange={(e) => dispatch({ type: "setCurrency", value: e.target.value })}
            />
          </FormField>
          {error ? (
            <p className="text-sm text-feedback-danger-content" role="alert">
              {error}
            </p>
          ) : null}
          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={saving || !hasBackend}>
              {saving ? "Saving…" : "Save"}
            </Button>
            <Link
              to="/inventory/suppliers"
              className="inline-flex items-center text-sm font-medium text-interactive-primary hover:text-interactive-primary-hover"
            >
              Cancel
            </Link>
          </div>
        </form>
      )}
    </div>
  )
}
