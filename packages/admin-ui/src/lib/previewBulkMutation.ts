type ToastFn = (options: {
  id?: string
  title: string
  description?: string
  variant?: "default" | "error"
}) => void

type PreviewBulkMutationArgs = {
  toast: ToastFn
  count: number
  /** Singular noun, e.g. "product". */
  noun: string
  /** Verb phrase for the title, e.g. "delete" or "set to Draft". */
  verb: string
  id?: string
  variant?: "default" | "error"
  description?: string
  onDone?: () => void
}

const DEFAULT_DESCRIPTION =
  "This bulk action wires up to Medusa next — nothing was changed yet."

/**
 * UI-only bulk mutation feedback — confirms intent with a preview toast without
 * calling Medusa. Clears selection via `onDone` when provided.
 */
export function previewBulkMutation({
  toast,
  count,
  noun,
  verb,
  id,
  variant,
  description = DEFAULT_DESCRIPTION,
  onDone,
}: PreviewBulkMutationArgs): void {
  if (count === 0) return
  toast({
    id,
    title: `Preview: ${verb} ${count} ${count === 1 ? noun : `${noun}s`}`,
    description,
    variant,
  })
  onDone?.()
}
