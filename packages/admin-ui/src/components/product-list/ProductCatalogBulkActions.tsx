import { useCallback, useState } from "react"

import {
  PRODUCT_BULK_STATUS_OPTIONS,
} from "@/components/product-list/productStatusMeta"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogDestructiveAction,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/AlertDialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu"
import { IconChevronDown } from "@/components/ui/icons"
import { BulkActionBar, bulkActionButtonClass } from "@/components/ui/list/BulkActionBar"
import { useToast } from "@/components/ui/Toast"

import type { ProductStatusValue } from "@/hooks/products/useProductsCatalogList"

import { previewBulkMutation } from "@/lib/previewBulkMutation"
import { cn } from "@/lib/cn"

/** Lower-frequency bulk actions in the "…" overflow menu. */
const BULK_OVERFLOW_ACTIONS: { id: string; label: string; verb: string }[] = [
  { id: "export", label: "Export as CSV", verb: "export" },
  { id: "duplicate", label: "Duplicate", verb: "duplicate" },
  { id: "category", label: "Add to category", verb: "add to category" },
]

const BULK_NOUN = "product"

const STATUS_PREVIEW_DESCRIPTION =
  "Bulk status changes wire up to Medusa next — nothing was changed yet."

const DELETE_PREVIEW_DESCRIPTION =
  "Bulk delete wires up to Medusa next — nothing was changed yet."

type ProductCatalogBulkActionsProps = {
  selectedCount: number
  onClearSelection: () => void
}

/**
 * Floating bulk-action bar + delete confirm for the product catalogue. UI-only
 * until Medusa Admin bulk endpoints are wired in a follow-up slice.
 */
export function ProductCatalogBulkActions({
  selectedCount,
  onClearSelection,
}: ProductCatalogBulkActionsProps): JSX.Element {
  const { toast } = useToast()
  const [deleteOpen, setDeleteOpen] = useState(false)

  const runPreview = useCallback(
    (args: Omit<Parameters<typeof previewBulkMutation>[0], "toast" | "count" | "noun" | "onDone">) => {
      previewBulkMutation({
        toast,
        count: selectedCount,
        noun: BULK_NOUN,
        onDone: onClearSelection,
        ...args,
      })
    },
    [toast, selectedCount, onClearSelection],
  )

  const applyBulkStatus = useCallback(
    (status: ProductStatusValue, label: string): void => {
      runPreview({
        id: `bulk-status-${status}`,
        verb: `set to ${label}`,
        description: STATUS_PREVIEW_DESCRIPTION,
      })
    },
    [runPreview],
  )

  const confirmBulkDelete = useCallback((): void => {
    setDeleteOpen(false)
    runPreview({
      verb: "delete",
      variant: "error",
      description: DELETE_PREVIEW_DESCRIPTION,
    })
  }, [runPreview])

  const previewOverflowAction = useCallback(
    (id: string, verb: string): void => {
      runPreview({ id: `bulk-${id}`, verb })
    },
    [runPreview],
  )

  return (
    <>
      <BulkActionBar count={selectedCount} noun={BULK_NOUN} onClear={onClearSelection}>
        <DropdownMenu>
          <DropdownMenuTrigger className={bulkActionButtonClass}>
            Set status
            <IconChevronDown size={13} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" side="top" sideOffset={8}>
            {PRODUCT_BULK_STATUS_OPTIONS.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onSelect={() => applyBulkStatus(option.value, option.label)}
              >
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <button
          type="button"
          className={bulkActionButtonClass}
          onClick={() => setDeleteOpen(true)}
        >
          Delete
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(bulkActionButtonClass, "w-7 justify-center px-0")}
            aria-label="More actions"
          >
            <span aria-hidden className="text-base leading-none">
              ⋯
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" sideOffset={8}>
            {BULK_OVERFLOW_ACTIONS.map((action) => (
              <DropdownMenuItem
                key={action.id}
                onSelect={() => previewOverflowAction(action.id, action.verb)}
              >
                {action.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </BulkActionBar>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {selectedCount} {selectedCount === 1 ? BULK_NOUN : `${BULK_NOUN}s`}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This removes the selected {selectedCount === 1 ? BULK_NOUN : `${BULK_NOUN}s`} from
              the catalogue. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogDestructiveAction onClick={confirmBulkDelete}>
              Delete
            </AlertDialogDestructiveAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
