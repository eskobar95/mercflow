import * as TabsPrimitive from "@radix-ui/react-tabs"
import { useEffect, useRef, type ReactNode } from "react"

import { cn } from "@/lib/cn"

export type TabItem = {
  value: string
  label: ReactNode
  content: ReactNode
  disabled?: boolean
}

type TabsProps = {
  items: TabItem[]
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  className?: string
  listClassName?: string
}

/**
 * Radix tabs with clip-path active indicator (Emil color-transition technique).
 */
export function Tabs({
  items,
  value,
  defaultValue,
  onValueChange,
  className,
  listClassName,
}: TabsProps): JSX.Element {
  const listRef = useRef<HTMLDivElement | null>(null)
  const clipRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const list = listRef.current
    const clip = clipRef.current
    if (!list || !clip) {
      return
    }

    const active = list.querySelector<HTMLElement>('[data-state="active"]')
    if (!active) {
      return
    }

    const listRect = list.getBoundingClientRect()
    const tabRect = active.getBoundingClientRect()
    const left = tabRect.left - listRect.left
    const width = tabRect.width

    clip.style.clipPath = `inset(0 calc(100% - ${left + width}px) 0 ${left}px)`
  }, [value, defaultValue, items])

  const initial = defaultValue ?? items[0]?.value ?? ""

  return (
    <TabsPrimitive.Root
      value={value}
      defaultValue={value === undefined ? initial : undefined}
      onValueChange={onValueChange}
      className={cn("w-full", className)}
    >
      <div ref={listRef} className="relative border-b border-border-default">
        <TabsPrimitive.List
          className={cn(
            "relative flex flex-wrap gap-1 px-1",
            listClassName,
          )}
          aria-label="Sections"
        >
          {items.map((item) => (
            <TabsPrimitive.Trigger
              key={item.value}
              value={item.value}
              disabled={item.disabled}
              className={cn(
                "relative z-10 min-h-11 rounded-t-md px-4 py-2 text-sm font-medium text-content-secondary",
                "transition-[color] duration-150",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus",
                "data-[state=active]:text-content-primary",
                "disabled:cursor-not-allowed disabled:opacity-50",
              )}
              style={{ transitionTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)" }}
            >
              {item.label}
            </TabsPrimitive.Trigger>
          ))}
        </TabsPrimitive.List>
        <div
          ref={clipRef}
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 top-0 overflow-hidden"
        >
          <div className="flex h-full gap-1 px-1">
            {items.map((item) => (
              <div
                key={item.value}
                className="min-h-11 rounded-t-md bg-surface-subtle px-4 py-2 text-sm font-medium text-content-primary opacity-0"
              >
                {item.label}
              </div>
            ))}
          </div>
        </div>
      </div>
      {items.map((item) => (
        <TabsPrimitive.Content
          key={item.value}
          value={item.value}
          className="pt-4 focus-visible:outline-none"
        >
          {item.content}
        </TabsPrimitive.Content>
      ))}
    </TabsPrimitive.Root>
  )
}
