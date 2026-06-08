import type { ReactNode } from "react"

import { Button } from "@/components/ui/Button"
import { ENTER_EASE, SHEET_CLOSE_MS, SHEET_OPEN_MS } from "@/constants/motion"
import { cn } from "@/lib/cn"

type ProductSaveBarProps = {
  visible: boolean
  saving: boolean
  canSave: boolean
  onSave: () => void
  onDiscard: () => void
  message?: string
}

/**
 * Sticky save bar shown while the editor has unsaved changes. Enters deliberately
 * and exits snappily (asymmetric timing); announces its state via `aria-live`.
 */
export function ProductSaveBar({
  visible,
  saving,
  canSave,
  onSave,
  onDiscard,
  message = "Unsaved changes",
}: ProductSaveBarProps): ReactNode {
  return (
    <div
      aria-live="polite"
      className={cn(
        "pointer-events-none sticky bottom-0 z-sticky flex justify-center pb-3 pt-2",
        "transition-[transform,opacity] motion-reduce:transition-none",
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0",
      )}
      style={{
        transitionDuration: `${visible ? SHEET_OPEN_MS : SHEET_CLOSE_MS}ms`,
        transitionTimingFunction: ENTER_EASE,
      }}
    >
      <div
        className={cn(
          "flex items-center gap-3 rounded-full border border-border-default bg-surface-raised px-3 py-2 shadow-lg",
          visible ? "pointer-events-auto" : "",
        )}
      >
        <span className="px-1 text-xs font-medium text-content-secondary">
          {saving ? "Saving…" : message}
        </span>
        <Button variant="ghost" size="sm" onClick={onDiscard} disabled={saving}>
          Discard
        </Button>
        <Button variant="primary" size="sm" onClick={onSave} disabled={!canSave || saving}>
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>
    </div>
  )
}
