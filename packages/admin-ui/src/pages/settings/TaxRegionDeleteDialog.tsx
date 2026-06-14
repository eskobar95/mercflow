import type { ReactNode } from "react"

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
import { formatSettingsCountryLabel } from "@/features/settings/settingsSelectOptions"
import type { TaxRegionRow } from "@/features/settings/types"

type TaxRegionDeleteDialogProps = {
  open: boolean
  region: TaxRegionRow | null
  deleting: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => Promise<void>
}

export function TaxRegionDeleteDialog({
  open,
  region,
  deleting,
  onOpenChange,
  onConfirm,
}: TaxRegionDeleteDialogProps): ReactNode {
  const countryLabel =
    region === null ? "this region" : formatSettingsCountryLabel(region.countryCode)

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete tax region?</AlertDialogTitle>
          <AlertDialogDescription>
            {region === null
              ? "This tax region will be removed permanently."
              : `Remove the ${countryLabel} tax region (${region.name}). Checkout will no longer charge this rate.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
          <AlertDialogDestructiveAction
            disabled={deleting}
            onClick={() => {
              void onConfirm()
            }}
          >
            {deleting ? "Deleting…" : "Delete region"}
          </AlertDialogDestructiveAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
