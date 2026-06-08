import { type ReactNode, useMemo } from "react"

import { EditorSection } from "@/components/products/editor/EditorSection"
import {
  metadataToRelationGroups,
  removeRelationKey,
  setListValues,
  setScalarValue,
  type RelationGroupKind,
} from "@/components/products/relations/relationAdapter"

import { AddRelationGroup } from "./AddRelationGroup"
import { RelationGroupEditor } from "./RelationGroupEditor"

type ProductRelationsTabProps = {
  metadata: Record<string, unknown>
  onChange: (next: Record<string, unknown>) => void
}

/**
 * Relations tab — edits dynamic relation groups (ingredients, brands, attributes)
 * on top of `metadata`. Changes flow into the editor draft and persist via the
 * global save bar. The relationAdapter contract keeps this ready to swap onto a
 * generic relation-table backend later.
 */
export function ProductRelationsTab({ metadata, onChange }: ProductRelationsTabProps): ReactNode {
  const groups = useMemo(() => metadataToRelationGroups(metadata), [metadata])

  const addGroup = (key: string, kind: RelationGroupKind, initialValue: string): void => {
    if (kind === "list") {
      onChange(setListValues(metadata, key, initialValue === "" ? [] : [initialValue]))
    } else {
      onChange(setScalarValue(metadata, key, initialValue))
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <EditorSection
        title="Relations & attributes"
        description="Dynamic groups attached to this product — stored in metadata for now."
      >
        {groups.length === 0 ? (
          <p className="text-sm text-content-secondary">
            No relations yet. Add one to attach ingredients, a brand, or custom attributes.
          </p>
        ) : (
          <div className="space-y-3">
            {groups.map((group) => (
              <RelationGroupEditor
                key={group.key}
                group={group}
                onChangeValues={(values) => {
                  onChange(
                    group.kind === "scalar"
                      ? setScalarValue(metadata, group.key, values[0] ?? "")
                      : setListValues(metadata, group.key, values),
                  )
                }}
                onRemove={() => onChange(removeRelationKey(metadata, group.key))}
              />
            ))}
          </div>
        )}
      </EditorSection>

      <EditorSection title="Add relation">
        <AddRelationGroup existingKeys={groups.map((group) => group.key)} onAdd={addGroup} />
      </EditorSection>
    </div>
  )
}
