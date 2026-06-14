import { useCallback, useState, type ReactNode } from "react"

import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { IconCopy } from "@/components/ui/icons"
import { isFullPublishableToken } from "@/features/api-keys/parseApiKeysResponse"
import type { ApiKeyDto } from "@/features/api-keys/types"

import { RevokePublishableApiKeyDialog } from "./RevokePublishableApiKeyDialog"

type CopyState = "idle" | "copied" | "failed"

type PublishableApiKeyCardProps = {
  apiKey: ApiKeyDto
  revealedToken: string | null
  isRegenerating: boolean
  regenerateError: string | null
  onRegenerate: () => Promise<void>
}

function resolveCopyValue(apiKey: ApiKeyDto, revealedToken: string | null): string {
  if (revealedToken !== null && isFullPublishableToken(revealedToken)) return revealedToken
  if (isFullPublishableToken(apiKey.token)) return apiKey.token
  return apiKey.redacted
}

export function PublishableApiKeyCard({
  apiKey,
  revealedToken,
  isRegenerating,
  regenerateError,
  onRegenerate,
}: PublishableApiKeyCardProps): ReactNode {
  const [copyState, setCopyState] = useState<CopyState>("idle")
  const [dialogOpen, setDialogOpen] = useState(false)

  const displayValue =
    revealedToken !== null && isFullPublishableToken(revealedToken)
      ? revealedToken
      : apiKey.redacted

  const handleCopy = useCallback(async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(resolveCopyValue(apiKey, revealedToken))
      setCopyState("copied")
    } catch {
      setCopyState("failed")
    }
  }, [apiKey, revealedToken])

  return (
    <>
      <Card className="p-6 lg:p-8">
        <h2 className="text-lg font-semibold text-content-primary">Publishable API key</h2>
        <p className="mt-2 max-w-prose text-sm text-content-secondary">
          Use this key in your storefront or headless client. It identifies your sales channel and
          is safe to expose in browser code.
        </p>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <code
            className="block flex-1 overflow-x-auto rounded-lg bg-surface-subtle px-3 py-2 font-mono text-sm text-content-primary"
            data-testid="publishable-api-key-display"
          >
            {displayValue}
          </code>
          <Button
            type="button"
            variant="secondary"
            shape="pill"
            aria-label="Copy publishable API key"
            onClick={() => void handleCopy()}
          >
            <IconCopy size={16} aria-hidden />
          </Button>
        </div>

        {copyState === "copied" ? (
          <p className="mt-2 text-sm text-feedback-success-content" aria-live="polite">
            Copied to clipboard
          </p>
        ) : null}
        {copyState === "failed" ? (
          <p className="mt-2 text-sm text-feedback-danger-content" role="alert">
            Could not copy — select the key manually
          </p>
        ) : null}

        {revealedToken !== null ? (
          <p className="mt-3 text-sm text-content-secondary" role="status">
            New key generated. Copy it now — the full value is only shown once after regeneration.
          </p>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-border-subtle pt-6">
          <Button
            type="button"
            variant="destructive"
            shape="pill"
            disabled={isRegenerating}
            onClick={() => setDialogOpen(true)}
          >
            Revoke &amp; regenerate
          </Button>
          <p className="text-sm text-content-secondary">
            Title: <span className="font-medium text-content-primary">{apiKey.title}</span>
          </p>
        </div>

        {regenerateError !== null ? (
          <p className="mt-3 text-sm text-content-danger" role="alert">
            {regenerateError}
          </p>
        ) : null}
      </Card>

      <RevokePublishableApiKeyDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        isSubmitting={isRegenerating}
        onConfirm={() => {
          void onRegenerate().then(() => setDialogOpen(false))
        }}
      />
    </>
  )
}
