import { forwardRef, useRef, type ChangeEvent, type InputHTMLAttributes } from "react"

import { IconClose, IconSearch } from "@/components/ui/icons"
import { cn } from "@/lib/cn"

import { formIconButtonClass } from "./formStyles"
import { Input } from "./Input"

type SearchInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  onClear?: () => void
  error?: boolean
}

/**
 * Search field with leading icon and optional clear affordance.
 */
export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  function SearchInput(
    { value, defaultValue, onChange, onClear, className, error, ...rest },
    ref,
  ) {
    const innerRef = useRef<HTMLInputElement | null>(null)
    const hasValue =
      typeof value === "string"
        ? value.length > 0
        : typeof defaultValue === "string"
          ? defaultValue.length > 0
          : false

    const setRefs = (node: HTMLInputElement | null): void => {
      innerRef.current = node
      if (typeof ref === "function") {
        ref(node)
      } else if (ref) {
        ref.current = node
      }
    }

    const handleClear = (): void => {
      const el = innerRef.current
      if (el) {
        const nativeSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          "value",
        )?.set
        nativeSetter?.call(el, "")
        el.dispatchEvent(new Event("input", { bubbles: true }))
      }
      onClear?.()
    }

    return (
      <div className={cn("relative w-full", className)}>
        <Input
          ref={setRefs}
          type="search"
          value={value}
          defaultValue={defaultValue}
          error={error}
          leadingIcon={<IconSearch size={16} />}
          onChange={onChange}
          className={hasValue ? "pr-11" : ""}
          {...rest}
        />
        {hasValue ? (
          <button
            type="button"
            aria-label="Clear search"
            onClick={handleClear}
            className={cn(
              formIconButtonClass,
              "absolute right-1 top-1/2 min-h-9 min-w-9 -translate-y-1/2",
            )}
            style={{ transitionTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)" }}
          >
            <IconClose size={14} />
          </button>
        ) : null}
      </div>
    )
  },
)

export type { ChangeEvent }
