import { useCallback, useState, type ReactNode } from "react"

import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { buildStripeWebhookUrl } from "@/features/payments/paymentProvidersApi"

type PaymentsWebhookUrlCardProps = {
  storefrontUrl: string | null
}

type CopyState = "idle" | "copied" | "failed"

export function PaymentsWebhookUrlCard({ storefrontUrl }: PaymentsWebhookUrlCardProps): ReactNode {
  const webhookUrl = buildStripeWebhookUrl(storefrontUrl)
  const [copyState, setCopyState] = useState<CopyState>("idle")

  const handleCopy = useCallback(async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(webhookUrl)
      setCopyState("copied")
    } catch {
      setCopyState("failed")
    }
  }, [webhookUrl])

  return (
    <Card className="p-6 lg:p-8">
      <h2 className="text-lg font-semibold text-content-primary">Webhook endpoint</h2>
      <p className="mt-2 max-w-prose text-sm text-content-secondary">
        Register this URL in the Stripe Dashboard for payment and subscription events.
      </p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <code className="block flex-1 overflow-x-auto rounded-lg bg-surface-subtle px-3 py-2 text-sm text-content-primary">
          {webhookUrl}
        </code>
        <Button type="button" variant="secondary" shape="pill" onClick={() => void handleCopy()}>
          Copy URL
        </Button>
      </div>
      {copyState === "copied" ? (
        <p className="mt-2 text-sm text-feedback-success-content" aria-live="polite">
          Copied to clipboard
        </p>
      ) : null}
      {copyState === "failed" ? (
        <p className="mt-2 text-sm text-feedback-danger-content" role="alert">
          Could not copy — select the URL manually
        </p>
      ) : null}
      {storefrontUrl === null ? (
        <p className="mt-3 text-sm text-content-secondary">
          Set your storefront URL under Settings → Store → SEO to show your live domain here.
        </p>
      ) : null}
    </Card>
  )
}
