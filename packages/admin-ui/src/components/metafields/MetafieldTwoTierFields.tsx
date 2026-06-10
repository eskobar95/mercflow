import { type ReactNode } from "react"

import { Button } from "@/components/ui/Button"
import type { MetafieldDefinitionDto } from "@/features/metafields/types"

import { MetafieldValueField } from "./MetafieldValueField"

type MetafieldTwoTierFieldsProps = {
  definitions: readonly MetafieldDefinitionDto[]
  drafts: Record<string, string>
  fieldErrors: Record<string, string>
  expandedSecondaryIds: ReadonlySet<string>
  disabled?: boolean
  onDraftChange: (definitionId: string, draft: string) => void
  onToggleSecondary: (definitionId: string) => void
}

export function MetafieldTwoTierFields({
  definitions,
  drafts,
  fieldErrors,
  expandedSecondaryIds,
  disabled = false,
  onDraftChange,
  onToggleSecondary,
}: MetafieldTwoTierFieldsProps): ReactNode {
  const primary = definitions.filter((definition) => definition.is_primary)
  const secondary = definitions.filter((definition) => !definition.is_primary)

  return (
    <div className="space-y-4">
      {primary.map((definition) => (
        <MetafieldValueField
          key={definition.id}
          id={definition.id}
          name={definition.name}
          description={definition.description}
          type={definition.type}
          required={definition.is_required}
          draft={drafts[definition.id] ?? ""}
          error={fieldErrors[definition.id] ?? null}
          disabled={disabled}
          onDraftChange={(next) => {
            onDraftChange(definition.id, next)
          }}
        />
      ))}

      {secondary.length > 0 ? (
        <div className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-wide text-content-tertiary">
            More fields
          </p>
          <div className="flex flex-wrap gap-2">
            {secondary.map((definition) => {
              const isExpanded = expandedSecondaryIds.has(definition.id)
              return (
                <Button
                  key={definition.id}
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={disabled}
                  aria-expanded={isExpanded}
                  onClick={() => {
                    onToggleSecondary(definition.id)
                  }}
                >
                  {isExpanded ? definition.name : `+ ${definition.name}`}
                </Button>
              )
            })}
          </div>
          {secondary
            .filter((definition) => expandedSecondaryIds.has(definition.id))
            .map((definition) => (
              <MetafieldValueField
                key={`expanded-${definition.id}`}
                id={definition.id}
                name={definition.name}
                description={definition.description}
                type={definition.type}
                required={definition.is_required}
                draft={drafts[definition.id] ?? ""}
                error={fieldErrors[definition.id] ?? null}
                disabled={disabled}
                onDraftChange={(next) => {
                  onDraftChange(definition.id, next)
                }}
              />
            ))}
        </div>
      ) : null}
    </div>
  )
}
