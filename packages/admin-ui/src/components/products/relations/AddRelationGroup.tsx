import { type ReactNode, useState } from "react"

import type { RelationGroupKind } from "@/components/products/relations/relationAdapter"
import { Button } from "@/components/ui/Button"
import { FormField } from "@/components/ui/FormField"
import { Input } from "@/components/ui/Input"
import { Select } from "@/components/ui/Select"

type AddRelationGroupProps = {
  existingKeys: string[]
  onAdd: (key: string, kind: RelationGroupKind, initialValue: string) => void
}

const KIND_OPTIONS: Array<{ value: RelationGroupKind; label: string }> = [
  { value: "scalar", label: "Single value" },
  { value: "list", label: "List of values" },
]

/** Form to add a new relation group (a new `metadata` key). */
export function AddRelationGroup({ existingKeys, onAdd }: AddRelationGroupProps): ReactNode {
  const [name, setName] = useState("")
  const [kind, setKind] = useState<RelationGroupKind>("list")
  const [value, setValue] = useState("")

  const key = name.trim().toLowerCase().replace(/\s+/g, "_")
  const duplicate = key !== "" && existingKeys.includes(key)
  const canAdd = key !== "" && !duplicate

  return (
    <div className="rounded-md border border-dashed border-border-default p-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <FormField label="Relation name" error={duplicate ? "A relation with this key already exists." : undefined}>
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Ingredients, Brand"
            error={duplicate}
          />
        </FormField>
        <FormField label="Type">
          <Select
            value={kind}
            onValueChange={(next) => setKind(next as RelationGroupKind)}
            options={KIND_OPTIONS}
            aria-label="Relation type"
          />
        </FormField>
      </div>

      <FormField label="First value" className="mt-3">
        <Input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Optional starting value"
        />
      </FormField>

      <div className="mt-3 flex justify-end">
        <Button
          variant="secondary"
          size="sm"
          disabled={!canAdd}
          onClick={() => {
            onAdd(key, kind, value.trim())
            setName("")
            setValue("")
            setKind("list")
          }}
        >
          Add relation
        </Button>
      </div>
    </div>
  )
}
