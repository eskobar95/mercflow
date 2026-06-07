import { useEffect, useSyncExternalStore, type ReactNode } from "react"

/**
 * Page chrome — per-route content that a page injects into the global TopBar so
 * the page title is defined once (the route handle) and actions live in a single
 * header. Linear-style: the chrome bar owns identity + primary actions, the body
 * starts straight at the content.
 */
type PageChrome = {
  /** Small accessory shown next to the title (e.g. a live result count). */
  titleBadge: ReactNode
  /**
   * List-scoped controls placed right after the title on desktop (filter, sort,
   * busy spinner). Kept on the left because they shape *what you are looking at*,
   * distinct from the right-aligned page `actions` (*what you can do*). Hidden on
   * mobile, where the page renders its own compact toolbar row instead.
   */
  toolbar?: ReactNode
  /** Right-aligned page actions (primary + secondary). */
  actions: ReactNode
}

const EMPTY_CHROME: PageChrome = { titleBadge: null, toolbar: null, actions: null }

let currentChrome: PageChrome = EMPTY_CHROME
const listeners = new Set<() => void>()

function emit(): void {
  for (const listener of listeners) {
    listener()
  }
}

function setPageChrome(next: PageChrome): void {
  currentChrome = next
  emit()
}

function clearPageChrome(): void {
  if (currentChrome === EMPTY_CHROME) return
  currentChrome = EMPTY_CHROME
  emit()
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function getSnapshot(): PageChrome {
  return currentChrome
}

/** TopBar reads the currently-registered page chrome. */
export function usePageChromeValue(): PageChrome {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

/**
 * Register chrome for the current page. Pass a memoised `chrome` object so the
 * TopBar always reflects the latest toolbar/actions without a manual deps list.
 */
export function usePageChrome(chrome: PageChrome): void {
  useEffect(() => {
    setPageChrome(chrome)
    return () => {
      clearPageChrome()
    }
  }, [chrome])
}
