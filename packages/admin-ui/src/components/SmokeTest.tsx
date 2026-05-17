import { useState } from "react"

import { Card } from "@/components/ui/Card"

/**
 * Smoke test component to verify frontend functionality.
 * Tests: state management, event handling, conditional rendering.
 */
export function SmokeTest(): JSX.Element {
  const [clickCount, setClickCount] = useState<number>(0)
  const [showDetails, setShowDetails] = useState<boolean>(false)

  const handleIncrement = (): void => {
    setClickCount((prev) => prev + 1)
  }

  const handleReset = (): void => {
    setClickCount(0)
    setShowDetails(false)
  }

  const toggleDetails = (): void => {
    setShowDetails((prev) => !prev)
  }

  return (
    <Card className="border-l-4 border-l-border-focus">
      <div className="space-y-4">
        <header>
          <h2 className="text-lg font-semibold text-content-primary">
            Smoke Test Component
          </h2>
          <p className="text-sm text-content-secondary">
            Verifies frontend field functionality: state, events, and rendering.
          </p>
        </header>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleIncrement}
            className="inline-flex rounded-md bg-interactive-primary px-4 py-2 text-sm font-medium text-content-inverse shadow-sm transition hover:bg-interactive-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
          >
            Click me
          </button>
          <span className="text-sm text-content-secondary">
            Count: <strong className="text-content-primary">{clickCount}</strong>
          </span>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={toggleDetails}
            className="text-sm text-interactive-primary hover:text-interactive-primary-hover underline"
          >
            {showDetails ? "Hide details" : "Show details"}
          </button>
          {clickCount > 0 && (
            <button
              type="button"
              onClick={handleReset}
              className="text-sm text-content-tertiary hover:text-content-secondary"
            >
              Reset
            </button>
          )}
        </div>

        {showDetails && (
          <div className="rounded-md bg-surface-subtle p-3 text-sm text-content-secondary">
            <p>Click count is currently: {clickCount}</p>
            <p className="mt-1 text-xs text-content-tertiary">
              This demonstrates conditional rendering based on component state.
            </p>
          </div>
        )}
      </div>
    </Card>
  )
}
