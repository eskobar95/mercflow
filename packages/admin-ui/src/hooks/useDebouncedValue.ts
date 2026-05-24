import { useEffect, useState } from "react"

/**
 * Debounces updates to `value`, e.g. search input synced to API queries without firing per keystroke.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebounced(value)
    }, delayMs)
    return (): void => {
      window.clearTimeout(timer)
    }
  }, [value, delayMs])

  return debounced
}
