import { useId, useState, type FormEvent } from "react"
import { Link, useNavigate } from "react-router-dom"

import { Card } from "@/components/ui/Card"

const inputClassName =
  "w-full min-w-0 rounded-md border border-border-default bg-surface-default px-3 py-2 text-sm text-content-primary shadow-sm focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-border-focus"

const labelClassName = "text-sm font-medium text-content-primary"

/**
 * Create category flow (mock). URL-first, no Medusa. Deep-link: `/product-categories/new`.
 */
export function ProductCategoryNewPage(): JSX.Element {
  const navigate = useNavigate()
  const baseId = useId()
  const nameId = `${baseId}-name`
  const handleId = `${baseId}-handle`

  const [name, setName] = useState("")
  const [handle, setHandle] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const onSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault()
    setSuccessMessage(null)
    const trimmed = name.trim()
    if (!trimmed) {
      setError("Name is required.")
      return
    }
    setError(null)
    setSuccessMessage(
      `Mock save: category “${trimmed}” would be created (no API). You can add another or return to the list.`
    )
  }

  return (
    <div className="p-6">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 text-2xl font-semibold text-content-primary">
          New product category
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
              <label htmlFor={nameId} className={labelClassName}>
                Name <span className="text-content-danger">*</span>
              </label>
              <input
                id={nameId}
                name="name"
                type="text"
                autoComplete="off"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                }}
                className={`mt-1 ${inputClassName}`}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? `${nameId}-err` : undefined}
              />
              {error ? (
                <p
                  id={`${nameId}-err`}
                  className="mt-1 text-sm text-content-danger"
                  role="alert"
                >
                  {error}
                </p>
              ) : null}
            </div>
            <div>
              <label htmlFor={handleId} className={labelClassName}>
                Handle
              </label>
              <p className="mb-1 text-xs text-content-tertiary">
                Unique string for URLs (optional in this mock).
              </p>
              <input
                id={handleId}
                name="handle"
                type="text"
                autoComplete="off"
                value={handle}
                onChange={(e) => {
                  setHandle(e.target.value)
                }}
                className={`mt-1 ${inputClassName}`}
                placeholder="e.g. outerwear"
              />
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
                  navigate("/product-categories")
                }}
              >
                Cancel
              </button>
              <Link
                to="/product-categories"
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
