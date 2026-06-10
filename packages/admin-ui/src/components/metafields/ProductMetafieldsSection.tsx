import { type ReactNode } from "react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import type { MetafieldDefinitionDto } from "@/features/metafields/types"

import { MetafieldTwoTierFields } from "./MetafieldTwoTierFields"

type ProductMetafieldsSectionProps = {
  definitions: readonly MetafieldDefinitionDto[]
  drafts: Record<string, string>
  fieldErrors: Record<string, string>
  expandedSecondaryIds: ReadonlySet<string>
  loadState: "loading" | "error" | "ready"
  errorMessage?: string
  disabled?: boolean
  onDraftChange: (definitionId: string, draft: string) => void
  onToggleSecondary: (definitionId: string) => void
  onRetry?: () => void
}

export function ProductMetafieldsSection({
  definitions,
  drafts,
  fieldErrors,
  expandedSecondaryIds,
  loadState,
  errorMessage,
  disabled = false,
  onDraftChange,
  onToggleSecondary,
  onRetry,
}: ProductMetafieldsSectionProps): ReactNode {
  return (
    <section aria-labelledby="product-metafields-heading" className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="product-metafields-heading" className="text-lg font-semibold text-content-primary">
            Product metafields
          </h2>
          <p className="mt-1 text-sm text-content-secondary">
            Custom data applied to all products. Values save with the product.
          </p>
        </div>
        <Link
          to="/settings/custom-data"
          className="text-sm font-medium text-interactive-primary hover:text-interactive-primary-hover"
        >
          Add definition
        </Link>
      </div>

      <Card elevation="flat" className="space-y-4 p-6">
        {loadState === "loading" ? (
          <div
            aria-busy="true"
            aria-live="polite"
            className="rounded-md border border-border-subtle bg-surface-subtle p-4 animate-pulse"
          >
            <div className="h-4 max-w-xs rounded-sm bg-surface-default" />
            <div className="mt-3 h-4 max-w-md rounded-sm bg-surface-default" />
          </div>
        ) : null}

        {loadState === "error" ? (
          <div
            role="alert"
            className="rounded-md border border-border-default bg-surface-subtle p-3 text-sm text-content-secondary"
          >
            <p>{errorMessage ?? "Failed to load product metafields."}</p>
            {onRetry ? (
              <Button type="button" variant="secondary" size="sm" className="mt-2" onClick={onRetry}>
                Retry
              </Button>
            ) : null}
          </div>
        ) : null}

        {loadState === "ready" && definitions.length === 0 ? (
          <p className="text-sm text-content-secondary">
            No definitions added yet.{" "}
            <Link
              to="/settings/custom-data"
              className="font-medium text-interactive-primary hover:text-interactive-primary-hover"
            >
              Create one in Custom data
            </Link>
            .
          </p>
        ) : null}

        {loadState === "ready" && definitions.length > 0 ? (
          <MetafieldTwoTierFields
            definitions={definitions}
            drafts={drafts}
            fieldErrors={fieldErrors}
            expandedSecondaryIds={expandedSecondaryIds}
            disabled={disabled}
            onDraftChange={onDraftChange}
            onToggleSecondary={onToggleSecondary}
          />
        ) : null}
      </Card>
    </section>
  )
}
