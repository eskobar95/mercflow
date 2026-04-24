import { useId, useState, type FormEvent } from "react"
import { Link, useNavigate } from "react-router-dom"

import { Card } from "@/components/ui/Card"

const inputClassName =
  "w-full min-w-0 rounded-md border border-border-default bg-surface-default px-3 py-2 text-sm text-content-primary shadow-sm focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-border-focus"

const labelClassName = "text-sm font-medium text-content-primary"

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
      `Mock save: “${trimmed}” would be created (no API). You can add another or return to the list.`
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
            <div>
              <label htmlFor={titleId} className={labelClassName}>
                Title <span className="text-content-danger">*</span>
              </label>
              <input
                id={titleId}
                name="title"
                type="text"
                autoComplete="off"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value)
                }}
                className={`mt-1 ${inputClassName}`}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? `${titleId}-err` : undefined}
              />
              {error ? (
                <p
                  id={`${titleId}-err`}
                  className="mt-1 text-sm text-content-danger"
                  role="alert"
                >
                  {error}
                </p>
              ) : null}
            </div>
            <div>
              <label htmlFor={slugId} className={labelClassName}>
                Handle
              </label>
              <p className="mb-1 text-xs text-content-tertiary">
                URL slug (optional in this mock).
              </p>
              <input
                id={slugId}
                name="slug"
                type="text"
                autoComplete="off"
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value)
                }}
                className={`mt-1 ${inputClassName}`}
                placeholder="e.g. winter-jacket"
              />
            </div>
            <div>
              <label htmlFor={statusId} className={labelClassName}>
                Status
              </label>
              <select
                id={statusId}
                name="status"
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value as ProductFormStatus)
                }}
                className={`mt-1 ${inputClassName}`}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <button
                type="submit"
                className="rounded-md bg-interactive-primary px-4 py-2 text-sm font-medium text-content-inverse transition hover:bg-interactive-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
              >
                Save (mock)
              </button>
              <button
                type="button"
                className="rounded-md border border-border-default bg-surface-raised px-4 py-2 text-sm font-medium text-content-primary shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
                onClick={() => {
                  navigate("/products")
                }}
              >
                Cancel
              </button>
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
