import { cn } from "@/lib/cn"

type Status = "draft" | "published" | "proposed"

const config: Record<Status, { label: string; className: string }> = {
  published: {
    label: "Published",
    className: "bg-feedback-success-subtle text-feedback-success-content border-feedback-success-subtle",
  },
  draft: {
    label: "Draft",
    className: "bg-surface-subtle text-content-secondary border-border-subtle",
  },
  proposed: {
    label: "Proposed",
    className: "bg-[hsl(38,80%,94%)] text-[hsl(30,60%,36%)] border-[hsl(38,50%,84%)]",
  },
}

export function ProductStatusBadge({ status }: { status: Status }): JSX.Element {
  const { label, className } = config[status]
  return (
    <span
      className={cn(
        "inline-flex items-center rounded border px-1.5 py-0.5 text-[11px] font-medium",
        className,
      )}
    >
      {label}
    </span>
  )
}
