import * as SeparatorPrimitive from "@radix-ui/react-separator"

import { cn } from "@/lib/cn"

type DividerProps = {
  orientation?: "horizontal" | "vertical"
  decorative?: boolean
  className?: string
}

export function Divider({
  orientation = "horizontal",
  decorative = true,
  className,
}: DividerProps): JSX.Element {
  return (
    <SeparatorPrimitive.Root
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "shrink-0 bg-border-default",
        orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
        className,
      )}
    />
  )
}
