import { useEffect, useRef } from "react"

/**
 * Runs `callback` every `delayMs` while `enabled` is true.
 * Pass `null` for `delayMs` to disable the interval.
 */
export function useInterval(callback: () => void, delayMs: number | null, enabled = true): void {
  const savedCallback = useRef(callback)

  useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  useEffect(() => {
    if (!enabled || delayMs === null) {
      return
    }

    const tick = (): void => {
      savedCallback.current()
    }

    const id = window.setInterval(tick, delayMs)
    return () => {
      window.clearInterval(id)
    }
  }, [delayMs, enabled])
}
