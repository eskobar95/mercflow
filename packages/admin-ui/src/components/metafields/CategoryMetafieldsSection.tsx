import { type ReactNode } from "react"

import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"

import { MetafieldValueField } from "./MetafieldValueField"
import { useCategoryMetafields } from "./useCategoryMetafields"

type CategoryMetafieldsSectionProps = {
  categoryId: string
}

export function CategoryMetafieldsSection({
  categoryId,
}: CategoryMetafieldsSectionProps): ReactNode {
  const { state, saving, saveError, saveMessage, isDirty, reload, setDraft, save } =
    useCategoryMetafields(categoryId)

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-content-primary">Category metafields</h2>
          <p className="mt-1 text-sm text-content-secondary">
            Custom data defined for categories in Settings → Custom data. Values are saved per
            category.
          </p>
        </div>
        {state.status === "ready" && state.definitions.length > 0 ? (
          <Button
            type="button"
            size="sm"
            disabled={!isDirty || saving}
            onClick={() => {
              void save()
            }}
          >
            {saving ? "Saving…" : "Save metafields"}
          </Button>
        ) : null}
      </div>

      {state.status === "loading" || state.status === "idle" ? (
        <div
          aria-busy="true"
          aria-live="polite"
          className="mt-4 rounded-md border border-border-subtle bg-surface-subtle p-4 animate-pulse"
        >
          <div className="h-4 max-w-xs rounded-sm bg-surface-default" />
          <div className="mt-3 h-4 max-w-md rounded-sm bg-surface-default" />
        </div>
      ) : null}

      {state.status === "error" ? (
        <div
          role="alert"
          className="mt-4 rounded-md border border-border-default bg-surface-subtle p-3 text-sm text-content-secondary"
        >
          <p>{state.message}</p>
          <Button type="button" variant="secondary" size="sm" className="mt-2" onClick={reload}>
            Retry
          </Button>
        </div>
      ) : null}

      {state.status === "ready" && state.definitions.length === 0 ? (
        <p className="mt-4 text-sm text-content-secondary">
          No category metafield definitions yet. Add definitions under Settings → Custom data →
          Categories.
        </p>
      ) : null}

      {state.status === "ready" && state.definitions.length > 0 ? (
        <div className="mt-4 space-y-4">
          {state.definitions.map((definition) => (
            <MetafieldValueField
              key={definition.id}
              id={definition.id}
              name={definition.name}
              description={definition.description}
              type={definition.type}
              required={definition.is_required}
              draft={state.drafts[definition.id] ?? ""}
              disabled={saving}
              onDraftChange={(next) => {
                setDraft(definition.id, next)
              }}
            />
          ))}
        </div>
      ) : null}

      {saveError ? (
        <p className="mt-4 text-sm text-status-error" role="alert">
          {saveError}
        </p>
      ) : null}

      {saveMessage ? (
        <p className="mt-4 text-sm text-content-secondary" role="status" aria-live="polite">
          {saveMessage}
        </p>
      ) : null}
    </Card>
  )
}
