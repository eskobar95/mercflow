import { Card } from "@/components/ui/Card"

/**
 * Minimal proof that Tailwind utilities resolve to design-token CSS variables.
 * No hex literals — all colors from `mercflow-tokens.css` via the design-tokens Tailwind preset.
 */
export function TokenIntegrationProof(): JSX.Element {
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-content-primary">
          Design token integration
        </h1>
        <p className="text-base text-content-secondary">
          Surfaces, borders, and focus states use MercFlow tokens only.
        </p>
      </header>

      <Card className="border-l-4 border-l-border-focus">
        <p className="mb-4 text-content-primary">
          Card body uses token-backed{" "}
          <code className="font-mono text-sm text-content-tertiary">
            bg-surface-default
          </code>{" "}
          and border utilities.
        </p>
        <button
          type="button"
          className="inline-flex rounded-md bg-interactive-primary px-4 py-2 text-sm font-medium text-content-inverse shadow-sm transition hover:bg-interactive-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
        >
          Primary action
        </button>
      </Card>
    </div>
  )
}
