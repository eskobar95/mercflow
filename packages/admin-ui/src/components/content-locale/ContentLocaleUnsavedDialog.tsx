import { useEffect, type RefObject } from "react"

export type ContentLocaleUnsavedDialogProps = {
  dialogRef: RefObject<HTMLDialogElement>
  /** Busy while save, discard reload, or content fetch runs */
  actionDisabled: boolean
  onSave: () => void
  onDiscard: () => void
  /** Called when the dialog closes for any reason (Escape, Cancel, or programmatic `close()`). */
  onClose: () => void
}

/**
 * Native `<dialog>` for save-or-discard before changing editing locale (keyboard accessible).
 */
export function ContentLocaleUnsavedDialog({
  dialogRef,
  actionDisabled,
  onSave,
  onDiscard,
  onClose,
}: ContentLocaleUnsavedDialogProps): JSX.Element {
  useEffect(() => {
    const el = dialogRef.current
    if (el === null) {
      return
    }
    const handleClose = (): void => {
      onClose()
    }
    el.addEventListener("close", handleClose)
    return (): void => {
      el.removeEventListener("close", handleClose)
    }
  }, [dialogRef, onClose])

  return (
    <dialog
      ref={dialogRef}
      className="w-[min(100vw-2rem,28rem)] rounded-lg border border-border-default bg-surface-raised p-0 text-content-primary shadow-lg backdrop:bg-surface-overlay/40"
      aria-labelledby="content-locale-unsaved-title"
    >
      <div className="border-b border-border-subtle px-4 py-3">
        <h2 id="content-locale-unsaved-title" className="text-base font-semibold text-content-primary">
          Save or discard before switching language?
        </h2>
        <p className="mt-1 text-sm text-content-secondary">
          You have unsaved MercFlow content changes for this language. Save them, or discard to reload
          the last saved version — then you can switch.
        </p>
      </div>
      <div className="flex flex-col-reverse gap-2 px-4 py-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          className="rounded-md border border-border-default bg-surface-default px-3 py-2 text-sm font-medium text-content-primary shadow-sm hover:bg-surface-subtle focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus disabled:opacity-50"
          disabled={actionDisabled}
          onClick={() => {
            dialogRef.current?.close()
          }}
        >
          Cancel
        </button>
        <button
          type="button"
          className="rounded-md border border-border-default bg-surface-default px-3 py-2 text-sm font-medium text-content-primary shadow-sm hover:bg-surface-subtle focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus disabled:opacity-50"
          disabled={actionDisabled}
          onClick={() => {
            onDiscard()
          }}
        >
          Discard and switch
        </button>
        <button
          type="button"
          className="rounded-md bg-interactive-primary px-3 py-2 text-sm font-medium text-content-inverse hover:bg-interactive-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus disabled:opacity-50"
          disabled={actionDisabled}
          onClick={() => {
            onSave()
          }}
        >
          Save and switch
        </button>
      </div>
    </dialog>
  )
}
