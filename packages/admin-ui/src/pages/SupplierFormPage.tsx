import type { FormEvent, JSX } from "react"
import { useCallback, useEffect, useState } from "react"
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

function MissingBackendConfigMessage(): JSX.Element {
  return (
    <p className="mt-6 text-sm text-text-secondary">
      Configure{" "}
      <code className="rounded bg-surface-subtle px-1">VITE_MEDUSA_ADMIN_BACKEND_URL</code>{" "}
      to load and save suppliers.
    </p>
  )
}

export function SupplierFormPage(): JSX.Element {
  const { supplierId } = useParams<{ supplierId: string }>()
  const navigate = useNavigate()
  const isCreate = supplierId === undefined || supplierId === "new"
  const hasBackend = resolveMedusaAdminBackendUrl() !== null

  const [name, setName] = useState("")
  const [contactPerson, setContactPerson] = useState("")
  const [email, setEmail] = useState("")
  const [country, setCountry] = useState("")
  const [currency, setCurrency] = useState("")
  const [loading, setLoading] = useState(!isCreate && hasBackend)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isCreate || !hasBackend || !supplierId) {
      if (!isCreate) {
        setLoading(false)
      }
      return
    }
    void (async (): Promise<void> => {
      setLoading(true)
      setError(null)
      try {
        const rows = await listSuppliersAdmin()
        const row = rows.find((r) => r.id === supplierId)
        if (!row) {
          setError("Supplier not found")
          return
        }
        setName(row.name)
        setContactPerson(row.contact_person ?? "")
        setEmail(row.email ?? "")
        setCountry(row.country ?? "")
        setCurrency(row.currency ?? "")
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load supplier")
      } finally {
        setLoading(false)
      }
    })()
  }, [hasBackend, isCreate, supplierId])

  const onSubmit = useCallback(
    async (event: FormEvent): Promise<void> => {
      event.preventDefault()
      if (!hasBackend) {
        setError("Backend URL is not configured")
        return
      }
      setSaving(true)
      setError(null)
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
        setError(e instanceof Error ? e.message : "Save failed")
      } finally {
        setSaving(false)
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
              onChange={(e) => setName(e.target.value)}
              required
            />
          </FormField>
          <FormField label="Contact person" htmlFor="supplier-contact">
            <Input
              id="supplier-contact"
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
            />
          </FormField>
          <FormField label="Email" htmlFor="supplier-email">
            <Input
              id="supplier-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </FormField>
          <FormField label="Country" htmlFor="supplier-country">
            <Input
              id="supplier-country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            />
          </FormField>
          <FormField label="Currency" htmlFor="supplier-currency">
            <Input
              id="supplier-currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
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
