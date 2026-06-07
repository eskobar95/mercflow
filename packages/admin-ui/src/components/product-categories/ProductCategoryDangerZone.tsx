import type { ReactNode } from "react"

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/AlertDialog"
import { Button } from "@/components/ui/Button"

type ProductCategoryDangerZoneProps = {
  categoryId: string
  initialName: string
  submitting: boolean
  deleting: boolean
  deleteOpen: boolean
  onDeleteOpenChange: (open: boolean) => void
  onConfirmDelete: () => Promise<void>
}

export function ProductCategoryDangerZone({
  initialName,
  submitting,
  deleting,
  deleteOpen,
  onDeleteOpenChange,
  onConfirmDelete,
}: ProductCategoryDangerZoneProps): ReactNode {
  return (
    <div className="mt-8 border-t border-border-subtle pt-6">
      <h3 className="text-base font-semibold text-content-primary">Danger zone</h3>
      <p className="mt-1 text-sm text-content-secondary">
        Delete this category only when it has no linked products or child categories blocking removal. Medusa rejects the delete if constraints fail.
      </p>
      <Button
        type="button"
        variant="destructive"
        size="sm"
        className="mt-3"
        disabled={submitting || deleting}
        onClick={() => {
          onDeleteOpenChange(true)
        }}
      >
        Delete category…
      </Button>

      <AlertDialog open={deleteOpen} onOpenChange={onDeleteOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this category?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone. If products are assigned to{" "}
              <span className="font-medium text-content-primary">{initialName}</span>, Medusa
              will refuse the deletion — you’ll see the error inline.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={deleting}
              onClick={() => {
                void onConfirmDelete()
              }}
            >
              {deleting ? "Deleting…" : "Delete category"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
