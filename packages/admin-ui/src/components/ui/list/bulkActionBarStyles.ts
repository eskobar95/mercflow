import { cn } from "@/lib/cn"

/**
 * Shared style for action controls placed inside the (dark) bulk bar — quiet on
 * the ink surface, tinting on hover, with press feedback.
 */
export const bulkActionButtonClass = cn(
  "inline-flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-content-inverse/85",
  "transition-[background-color,color,transform] duration-fast ease-enter",
  "hover:bg-content-inverse/15 hover:text-content-inverse active:scale-[0.96]",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-content-inverse/40",
  "motion-reduce:transition-none motion-reduce:active:scale-100",
)
