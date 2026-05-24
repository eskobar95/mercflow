import { useId, useState, type FormEvent } from "react"
import { Link, useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { FormField } from "@/components/ui/FormField"
import { Input } from "@/components/ui/Input"

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
      `Mock save: category “${trimmed}” would be created (no API). You can add another or return to the list.`,
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
            <FormField
              label="Name"
              htmlFor={nameId}
              required
              error={error ?? undefined}
            >
              <Input
                id={nameId}
                name="name"
                type="text"
                autoComplete="off"
                value={name}
                error={Boolean(error)}
                onChange={(e) => {
                  setName(e.target.value)
                }}
                aria-invalid={Boolean(error)}
              />
            </FormField>
            <FormField
              label="Handle"
              htmlFor={handleId}
              hint="Unique string for URLs (optional in this mock)."
            >
              <Input
                id={handleId}
                name="handle"
                type="text"
                autoComplete="off"
                value={handle}
                onChange={(e) => {
                  setHandle(e.target.value)
                }}
                placeholder="e.g. outerwear"
              />
            </FormField>
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <Button type="submit" variant="primary">
                Save (mock)
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  navigate("/product-categories")
                }}
              >
                Cancel
              </Button>
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
