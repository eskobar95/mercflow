import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react"

import { MetafieldTypeBadge } from "@/components/metafields/MetafieldTypeBadge"
import { Button } from "@/components/ui/Button"
import { Checkbox } from "@/components/ui/Checkbox"
import { DialogFooter, DialogShell } from "@/components/ui/Dialog"
import { Spinner } from "@/components/ui/Spinner"
import { useToast } from "@/components/ui/Toast"
import {
  activateStandardLibraryDefinitions,
  listStandardLibraryDefinitions,
} from "@/features/metafields/metafieldStandardLibraryApi"
import type {
  MetafieldDefinitionDto,
  MetafieldLibraryVertical,
  MetafieldOwnerType,
} from "@/features/metafields/types"
import { METAFIELD_LIBRARY_VERTICALS } from "@/features/metafields/types"
import { useAdjustStateWhenKeyChanges } from "@/lib/react/useAdjustStateWhenKeyChanges"

const VERTICAL_LABELS: Record<MetafieldLibraryVertical, string> = {
  skincare: "Skincare",
  fashion: "Fashion",
}

type LibraryPhase = "idle" | "loading" | "ready" | "error" | "activating"

type StandardLibraryBrowseDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  ownerType: MetafieldOwnerType
  onActivated: () => Promise<void>
}

function verticalFilterButtonClass(isActive: boolean): string {
  return `rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
    isActive
      ? "bg-surface-subtle text-content-primary"
      : "text-content-secondary hover:bg-surface-subtle hover:text-content-primary"
  }`
}

export function StandardLibraryBrowseDialog({
  open,
  onOpenChange,
  ownerType,
  onActivated,
}: StandardLibraryBrowseDialogProps): ReactNode {
  const { toast } = useToast()
  const [vertical, setVertical] = useState<MetafieldLibraryVertical>("skincare")
  const [rows, setRows] = useState<MetafieldDefinitionDto[]>([])
  const [phase, setPhase] = useState<LibraryPhase>("idle")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())

  const dialogSessionKey = open ? `${ownerType}:${vertical}` : "closed"

  useAdjustStateWhenKeyChanges(dialogSessionKey, () => {
    setSelectedIds(new Set())
  })

  useAdjustStateWhenKeyChanges(open ? "open" : "closed", () => {
    setVertical("skincare")
    setRows([])
    setPhase("idle")
    setErrorMessage(null)
    setSelectedIds(new Set())
  })

  const loadLibrary = useCallback(async (): Promise<void> => {
    setPhase("loading")
    setErrorMessage(null)
    try {
      const definitions = await listStandardLibraryDefinitions({ vertical, ownerType })
      setRows(definitions)
      setPhase("ready")
    } catch (err: unknown) {
      setPhase("error")
      setErrorMessage(err instanceof Error ? err.message : "Failed to load standard library")
    }
  }, [ownerType, vertical])

  useEffect(() => {
    if (!open) {
      return
    }
    void loadLibrary()
  }, [loadLibrary, open])

  const selectedCount = selectedIds.size
  const allSelected = rows.length > 0 && selectedCount === rows.length

  const toggleDefinition = useCallback((id: string, checked: boolean): void => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (checked) {
        next.add(id)
      } else {
        next.delete(id)
      }
      return next
    })
  }, [])

  const toggleSelectAll = useCallback(
    (checked: boolean): void => {
      if (!checked) {
        setSelectedIds(new Set())
        return
      }
      setSelectedIds(new Set(rows.map((row) => row.id)))
    },
    [rows]
  )

  const ownerLabel = ownerType === "category" ? "categories" : "products"

  const body = useMemo((): ReactNode => {
    if (phase === "loading" || phase === "idle") {
      return (
        <div className="flex min-h-32 items-center justify-center py-6">
          <Spinner size="lg" label="Loading standard library" />
        </div>
      )
    }

    if (phase === "error") {
      return (
        <div role="alert" className="space-y-3 py-2 text-sm text-content-danger">
          <p>{errorMessage}</p>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              void loadLibrary()
            }}
          >
            Retry
          </Button>
        </div>
      )
    }

    if (rows.length === 0) {
      return (
        <p className="py-4 text-sm text-content-secondary">
          No standard definitions are available for {VERTICAL_LABELS[vertical]} {ownerLabel} yet.
        </p>
      )
    }

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 border-b border-border-subtle pb-2">
          <Checkbox
            id="standard-library-select-all"
            checked={allSelected}
            onCheckedChange={(value) => {
              toggleSelectAll(value === true)
            }}
            aria-label="Select all definitions"
          />
          <label
            htmlFor="standard-library-select-all"
            className="cursor-pointer text-sm font-medium text-content-primary"
          >
            Select all ({rows.length})
          </label>
        </div>
        <ul className="max-h-80 space-y-1 overflow-y-auto pr-1">
          {rows.map((row) => {
            const checkboxId = `standard-library-${row.id}`
            const isChecked = selectedIds.has(row.id)
            return (
              <li
                key={row.id}
                className="rounded-md border border-border-subtle px-3 py-2 hover:bg-surface-subtle"
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    id={checkboxId}
                    checked={isChecked}
                    touchTarget
                    onCheckedChange={(value) => {
                      toggleDefinition(row.id, value === true)
                    }}
                    aria-label={`Select ${row.name}`}
                  />
                  <label htmlFor={checkboxId} className="min-w-0 flex-1 cursor-pointer">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-content-primary">{row.name}</span>
                      <MetafieldTypeBadge type={row.type} />
                    </div>
                    {row.description ? (
                      <p className="mt-0.5 text-xs text-content-tertiary">{row.description}</p>
                    ) : null}
                  </label>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    )
  }, [
    allSelected,
    errorMessage,
    loadLibrary,
    ownerLabel,
    phase,
    rows,
    selectedIds,
    toggleDefinition,
    toggleSelectAll,
    vertical,
  ])

  const handleActivate = async (): Promise<void> => {
    if (selectedCount === 0) {
      return
    }
    setPhase("activating")
    setErrorMessage(null)
    try {
      const result = await activateStandardLibraryDefinitions({
        vertical,
        definitionIds: [...selectedIds],
      })
      await onActivated()
      onOpenChange(false)

      const activatedCount = result.activated.length
      const skippedCount = result.skippedKeys.length
      let description: string | undefined
      if (skippedCount > 0) {
        description = `${skippedCount} definition${skippedCount === 1 ? "" : "s"} already active and skipped.`
      }

      toast({
        variant: "success",
        title:
          activatedCount > 0
            ? `Activated ${activatedCount} definition${activatedCount === 1 ? "" : "s"}`
            : "No new definitions activated",
        description,
      })
    } catch (err: unknown) {
      setPhase("ready")
      setErrorMessage(err instanceof Error ? err.message : "Activation failed")
      toast({
        variant: "error",
        title: "Could not activate definitions",
        description: err instanceof Error ? err.message : "Activation failed",
      })
    }
  }

  return (
    <DialogShell
      open={open}
      onOpenChange={onOpenChange}
      title="Browse standard library"
      description={`Choose pre-built field definitions to add to your ${ownerLabel}.`}
      footer={
        <DialogFooter>
          <Button
            type="button"
            variant="secondary"
            disabled={phase === "activating"}
            onClick={() => {
              onOpenChange(false)
            }}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            disabled={phase !== "ready" || selectedCount === 0}
            onClick={() => {
              void handleActivate()
            }}
          >
            {phase === "activating" ? "Activating…" : "Activate selected"}
          </Button>
        </DialogFooter>
      }
    >
      <div className="space-y-4">
        <div
          role="group"
          aria-label="Filter by vertical"
          className="inline-flex gap-1 rounded-lg border border-border-subtle bg-surface-default p-1"
        >
          {METAFIELD_LIBRARY_VERTICALS.map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={vertical === value}
              disabled={phase === "activating"}
              className={verticalFilterButtonClass(vertical === value)}
              onClick={() => {
                setVertical(value)
              }}
            >
              {VERTICAL_LABELS[value]}
            </button>
          ))}
        </div>
        {body}
      </div>
    </DialogShell>
  )
}
