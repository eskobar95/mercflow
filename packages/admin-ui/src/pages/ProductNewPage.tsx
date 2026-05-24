import { useId, useState, type FormEvent } from "react"
import { Link, useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { FormField } from "@/components/ui/FormField"
import { Input } from "@/components/ui/Input"

type ProductFormStatus = "draft" | "published"

/**
 * Create-product flow (mock). URL-first, no Medusa. Deep-link: `/products/new`.
 */
export function ProductNewPage(): JSX.Element {
  const navigate = useNavigate()
  const baseId = useId()
  const titleId = `${baseId}-title`
  const slugId = `${baseId}-slug`
  const statusId = `${baseId}-status`

  const [title, setTitle] = useState("")
  const [slug, setSlug] = useState("")
  const [status, setStatus] = useState<ProductFormStatus>("draft")
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const onSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault()
    setSuccessMessage(null)
    const trimmed = title.trim()
    if (!trimmed) {
      setError("Title is required.")
      return
    }
    setError(null)
    setSuccessMessage(
      `Mock save: “${trimmed}” would be created (no API). You can add another or return to the list.`,
    )
  }

  return (
    <div className="p-6">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 text-2xl font-semibold text-content-primary">
          New product
        </h1>
        <Card>
          {successMessage ? (
            <p
              className="mb-4 text-sm text-content-secondary"
              role="status"
              aria-live="polite"
            >
              {successMessage}
            </p>
          ) : null}
          <form className="space-y-4" onSubmit={onSubmit} noValidate>
            <FormField
              label="Title"
              htmlFor={titleId}
              required
              error={error ?? undefined}
            >
              <Input
                id={titleId}
                name="title"
                type="text"
                autoComplete="off"
                value={title}
                error={Boolean(error)}
                onChange={(e) => {
                  setTitle(e.target.value)
                }}
                aria-invalid={Boolean(error)}
              />
            </FormField>
            <FormField
              label="Handle"
              htmlFor={slugId}
              hint="URL slug (optional in this mock)."
            >
              <Input
                id={slugId}
                name="slug"
                type="text"
                autoComplete="off"
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value)
                }}
                placeholder="e.g. winter-jacket"
              />
            </FormField>
            <FormField label="Status" htmlFor={statusId}>
              <select
                id={statusId}
                name="status"
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value as ProductFormStatus)
                }}
                className="w-full min-w-0 rounded-md border border-border-default bg-surface-default px-3 py-2 text-sm text-content-primary shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </FormField>
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <Button type="submit" variant="primary">
                Save (mock)
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  navigate("/products")
                }}
              >
                Cancel
              </Button>
              <Link
                to="/products"
                className="text-sm font-medium text-interactive-primary hover:text-interactive-primary-hover"
              >
                Back to list
              </Link>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}
