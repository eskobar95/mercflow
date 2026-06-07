import { useRef } from "react"

/**
 * Runs `adjust` during render when `key` changes (including first assignment).
 * Prefer this over useEffect for resetting local state when props/query data changes.
 * @see https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
 */
export function useAdjustStateWhenKeyChanges(
  key: string | null | undefined,
  adjust: () => void,
): void {
  const previousKeyRef = useRef<string | null | undefined>(undefined)

  if (previousKeyRef.current !== key) {
    previousKeyRef.current = key
    if (key !== null && key !== undefined) {
      adjust()
    }
  }
}

/**
 * Runs `adjust` during render when any value in `snapshot` differs from the previous render.
 */
export function useAdjustStateWhenSnapshotChanges(
  snapshot: readonly unknown[],
  adjust: () => void,
): void {
  const previousRef = useRef<readonly unknown[] | null>(null)
  const previous = previousRef.current

  const changed =
    previous === null ||
    snapshot.length !== previous.length ||
    snapshot.some((value, index) => !Object.is(value, previous[index]))

  if (changed) {
    previousRef.current = snapshot
    adjust()
  }
}
