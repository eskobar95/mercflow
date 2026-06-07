import { useEffect, useState } from "react"

type ScrollAwareFooterState = {
  /** True while the bar is pinned over scrollable content (not docked at the end). */
  floating: boolean
}

/** Pixels of slack before the very end counts as "reached the bottom". */
const BOTTOM_EPSILON = 4

/**
 * Tracks whether a `sticky bottom-0` footer is currently lifted over scrollable
 * content or resting at the end of the list.
 *
 * The footer stays visible at all times — this only reports `floating` so a
 * caller can show a soft elevation while there is content beneath the bar and
 * drop it once the user reaches the bottom (where a shadow would have nothing to
 * cast over). Re-evaluates whenever `revision` changes (e.g. rows load).
 */
export function useScrollAwareFooter(
  scrollElementId: string,
  revision: unknown,
): ScrollAwareFooterState {
  const [floating, setFloating] = useState(false)

  useEffect(() => {
    const el = document.getElementById(scrollElementId)
    if (!el) return

    let frame = 0

    const evaluate = (): void => {
      frame = 0
      const { scrollTop, scrollHeight, clientHeight } = el
      const canScroll = scrollHeight - clientHeight > BOTTOM_EPSILON
      const atBottom = scrollTop + clientHeight >= scrollHeight - BOTTOM_EPSILON
      setFloating(canScroll && !atBottom)
    }

    const onScroll = (): void => {
      if (frame) return
      frame = window.requestAnimationFrame(evaluate)
    }

    el.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)
    evaluate()

    return (): void => {
      el.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [scrollElementId, revision])

  return { floating }
}
