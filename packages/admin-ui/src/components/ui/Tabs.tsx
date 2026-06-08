import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react"

import { ENTER_EASE } from "@/constants/motion"
import { cn } from "@/lib/cn"

/**
 * Accessible tabs (WAI-ARIA tabs pattern).
 *
 * - `role=tablist/tab/tabpanel` with roving tabindex and Arrow/Home/End keys.
 * - An underline indicator slides under the active trigger. The slide is
 *   transform-based and disabled under `prefers-reduced-motion`.
 * - Controlled: the parent owns `value` (so it can mirror the URL `?tab=`).
 */
type TabsContextValue = {
  value: string
  setValue: (value: string) => void
  baseId: string
  registerTrigger: (value: string, node: HTMLButtonElement | null) => void
  orderedValues: () => string[]
}

const TabsContext = createContext<TabsContextValue | null>(null)

function useTabsContext(): TabsContextValue {
  const context = useContext(TabsContext)
  if (context === null) {
    throw new Error("Tabs.* must be used within <Tabs>")
  }
  return context
}

type TabsProps = {
  value: string
  onValueChange: (value: string) => void
  baseId: string
  className?: string
  children: ReactNode
}

export function Tabs({ value, onValueChange, baseId, className, children }: TabsProps): ReactNode {
  const triggersRef = useRef<Map<string, HTMLButtonElement> | null>(null)
  if (triggersRef.current === null) {
    triggersRef.current = new Map<string, HTMLButtonElement>()
  }
  const triggers = triggersRef.current

  const registerTrigger = useCallback(
    (triggerValue: string, node: HTMLButtonElement | null): void => {
      if (node === null) {
        triggers.delete(triggerValue)
      } else {
        triggers.set(triggerValue, node)
      }
    },
    [triggers],
  )

  const orderedValues = useCallback((): string[] => {
    return Array.from(triggers.entries())
      .toSorted((a, b) => {
        const position = a[1].compareDocumentPosition(b[1])
        return position & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1
      })
      .map(([key]) => key)
  }, [triggers])

  const contextValue = useMemo<TabsContextValue>(
    () => ({ value, setValue: onValueChange, baseId, registerTrigger, orderedValues }),
    [value, onValueChange, baseId, registerTrigger, orderedValues],
  )

  return (
    <TabsContext.Provider value={contextValue}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  )
}

type TabsListProps = {
  "aria-label": string
  className?: string
  children: ReactNode
}

export function TabsList({ "aria-label": ariaLabel, className, children }: TabsListProps): ReactNode {
  const { value } = useTabsContext()
  const listRef = useRef<HTMLDivElement>(null)
  const [indicator, setIndicator] = useState<{ left: number; width: number } | null>(null)

  const measure = useCallback((): void => {
    const list = listRef.current
    if (list === null) {
      return
    }
    const active = list.querySelector<HTMLButtonElement>(`[data-tab-value="${CSS.escape(value)}"]`)
    if (active === null) {
      setIndicator(null)
      return
    }
    setIndicator({ left: active.offsetLeft, width: active.offsetWidth })
  }, [value])

  useLayoutEffect(() => {
    measure()
    const list = listRef.current
    if (list === null || typeof ResizeObserver === "undefined") {
      return
    }
    const observer = new ResizeObserver(measure)
    observer.observe(list)
    return () => observer.disconnect()
  }, [measure])

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label={ariaLabel}
      className={cn("relative flex flex-wrap gap-1 border-b border-border-subtle", className)}
    >
      {children}
      {indicator !== null ? (
        <span
          aria-hidden
          className="absolute bottom-0 h-0.5 bg-interactive-primary transition-[transform,width] duration-200 motion-reduce:transition-none"
          style={{
            width: `${indicator.width}px`,
            transform: `translateX(${indicator.left}px)`,
            left: 0,
            transitionTimingFunction: ENTER_EASE,
          }}
        />
      ) : null}
    </div>
  )
}

type TabsTriggerProps = {
  value: string
  children: ReactNode
}

export function TabsTrigger({ value: triggerValue, children }: TabsTriggerProps): ReactNode {
  const { value, setValue, baseId, registerTrigger, orderedValues } = useTabsContext()
  const selected = value === triggerValue

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>): void => {
    const keys = ["ArrowRight", "ArrowLeft", "Home", "End"]
    if (!keys.includes(event.key)) {
      return
    }
    event.preventDefault()
    const values = orderedValues()
    const currentIndex = values.indexOf(triggerValue)
    let nextIndex = currentIndex
    if (event.key === "ArrowRight") {
      nextIndex = (currentIndex + 1) % values.length
    } else if (event.key === "ArrowLeft") {
      nextIndex = (currentIndex - 1 + values.length) % values.length
    } else if (event.key === "Home") {
      nextIndex = 0
    } else {
      nextIndex = values.length - 1
    }
    const nextValue = values[nextIndex]
    if (nextValue !== undefined) {
      setValue(nextValue)
      const list = event.currentTarget.parentElement
      requestAnimationFrame(() => {
        list
          ?.querySelector<HTMLButtonElement>(`[data-tab-value="${CSS.escape(nextValue)}"]`)
          ?.focus()
      })
    }
  }

  return (
    <button
      type="button"
      role="tab"
      id={`${baseId}-tab-${triggerValue}`}
      data-tab-value={triggerValue}
      aria-selected={selected}
      aria-controls={`${baseId}-panel-${triggerValue}`}
      tabIndex={selected ? 0 : -1}
      ref={(node) => registerTrigger(triggerValue, node)}
      onClick={() => setValue(triggerValue)}
      onKeyDown={onKeyDown}
      className={cn(
        "-mb-px border-b-2 border-transparent px-3 py-2 text-sm font-medium transition-colors duration-150",
        "outline-none focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-border-focus",
        selected ? "text-content-primary" : "text-content-secondary hover:text-content-primary",
      )}
    >
      {children}
    </button>
  )
}

type TabsContentProps = {
  value: string
  children: ReactNode
}

export function TabsContent({ value: contentValue, children }: TabsContentProps): ReactNode {
  const { value, baseId } = useTabsContext()
  const selected = value === contentValue

  return (
    <div
      role="tabpanel"
      id={`${baseId}-panel-${contentValue}`}
      aria-labelledby={`${baseId}-tab-${contentValue}`}
      hidden={!selected}
      tabIndex={0}
      className="outline-none"
    >
      {selected ? children : null}
    </div>
  )
}
