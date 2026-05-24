import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"

import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"
import { Switch } from "@/components/ui/Switch"
import { useShipmondoConnectorSettings } from "@/hooks/useShipmondoConnectorSettings"

function formatLastTestedAt(value: string | null): string {
  if (value === null || value.trim() === "") {
    return "Never tested"
  }
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) {
    return "Never tested"
  }
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d)
}

/**
 * Full-page workspace for configuring the Shipmondo connector (credentials, activation, probes).
 */
export function ShipmondoConnectorWorkspace(): JSX.Element {
  const { query, patch, test } = useShipmondoConnectorSettings()

  const snapshot = query.data ?? null

  const [draftActive, setDraftActive] = useState<boolean>(snapshot?.active ?? false)
  const [draftApiUser, setDraftApiUser] = useState("")
  const [draftApiKey, setDraftApiKey] = useState("")
  const [draftModuleKey, setDraftModuleKey] = useState("")
  const [formError, setFormError] = useState<string | null>(null)

  const [testBanner, setTestBanner] = useState<{
    tone: "success" | "danger"
    message: string
  } | null>(null)

  useEffect(() => {
    if (snapshot === null) {
      return
    }
    setDraftActive(snapshot.active)
  }, [snapshot])

  const configured = useMemo(() => {
    if (snapshot === null) {
      return false
    }
    return (
      snapshot.credentials.apiUserConfigured &&
      snapshot.credentials.apiKeyConfigured
    )
  }, [snapshot])

  useEffect(() => {
    if (test.isSuccess && test.data) {
      const result = test.data
      if (result.success) {
        setTestBanner({
          tone: "success",
          message: result.message ?? "Connection succeeded",
        })
      } else {
        setTestBanner({
          tone: "danger",
          message: result.error ?? "Connection failed",
        })
      }
    }
  }, [test.isSuccess, test.data])

  useEffect(() => {
    if (test.isIdle) {
      return
    }
    if (test.isPending) {
      setTestBanner(null)
    }
  }, [test.isPending, test.isIdle])

  const buildPatchBody = (): Record<string, unknown> | null => {
    if (snapshot === null) {
      return null
    }

    const body: Record<string, unknown> = {}

    const nextUser = draftApiUser.trim()
    const nextKey = draftApiKey.trim()
    const nextModuleKey = draftModuleKey.trim()

    if (!configured) {
      if (nextUser.length === 0 || nextKey.length === 0) {
        setFormError(
          "Provide both the API user and API key before saving for the first time."
        )
        return null
      }
    }

    const shouldSendUser = nextUser.length > 0
    const shouldSendKey = nextKey.length > 0

    if (shouldSendUser) {
      body.api_user = nextUser
    }
    if (shouldSendKey) {
      body.api_key = nextKey
    }

    if (
      snapshot.credentials.shippingModuleKeyConfigured &&
      nextModuleKey.length === 0
    ) {
      body.shipping_module_key = ""
    }

    if (nextModuleKey.length > 0) {
      body.shipping_module_key = nextModuleKey
    }

    body.active = draftActive

    return body
  }

  const handleSave = (): void => {
    setFormError(null)
    const body = buildPatchBody()
    if (body === null) {
      return
    }

    patch.mutate(body, {
      onSuccess: () => {
        setDraftApiUser("")
        setDraftApiKey("")
        setDraftModuleKey("")
      },
      onError: (e: Error) => {
        setFormError(e.message)
      },
    })
  }

  const handleTest = (): void => {
    setFormError(null)
    setTestBanner(null)
    test.mutate(undefined, {
      onError: (e: Error) => {
        setTestBanner({ tone: "danger", message: e.message })
      },
    })
  }

  return (
    <div className="p-6">
      <Link
        to="/settings/connectors"
        className="text-sm font-medium text-interactive-primary hover:text-interactive-primary-hover"
      >
        ← Connectors
      </Link>

      <div className="mt-4 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-content-tertiary">
          Integrations
        </p>
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-content-primary">Shipmondo</h1>
            <p className="max-w-2xl text-sm text-content-secondary">
              Store your Shipmondo API credentials securely, control whether rates are exposed to
              shoppers, and probe the live API without leaving the admin.
            </p>
          </div>
          <div className="text-sm text-content-secondary">
            <p>
              Last probe:{" "}
              <span className="font-medium text-content-primary">
                {snapshot ? formatLastTestedAt(snapshot.lastTestedAt) : "—"}
              </span>
            </p>
          </div>
        </div>
      </div>

      {query.isLoading ? (
        <div className="mt-8 h-64 animate-pulse rounded-md border border-border-subtle bg-surface-subtle" />
      ) : null}

      {query.isError ? (
        <div
          role="alert"
          className="mt-6 rounded-lg border border-interactive-danger-subtle bg-surface-default p-4 text-sm text-content-danger shadow-sm"
        >
          <p className="font-medium">Could not load Shipmondo settings</p>
          <p className="mt-1 text-content-secondary">
            {query.error instanceof Error
              ? query.error.message
              : "Unexpected error while contacting the backend."}
          </p>
        </div>
      ) : null}

      {query.isSuccess && snapshot !== null ? (
        <div className="mt-8 space-y-6">
          <Card elevation="flat">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-content-primary">
                    Connector activation
                  </p>
                  <p className="mt-1 text-sm text-content-secondary">
                    When inactive, MercFlow tells the storefront not to surface Shipmondo shipping
                    ({`GET /store/connectors/shipmondo/active`}).
                  </p>
                </div>
                <Switch
                  id="shipmondo-active"
                  checked={draftActive}
                  onCheckedChange={(v) => setDraftActive(v === true)}
                  label={draftActive ? "Active" : "Inactive"}
                  aria-label="Toggle Shipmondo connector active state"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="shipmondo-api-user" required>
                    API user
                  </Label>
                  <Input
                    id="shipmondo-api-user"
                    name="shipmondo-api-user"
                    autoComplete="off"
                    placeholder={
                      snapshot.credentials.apiUserConfigured
                        ? "Leave blank to keep the saved user"
                        : "Your Shipmondo API user"
                    }
                    value={draftApiUser}
                    onChange={(e) => setDraftApiUser(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shipmondo-api-key" required={!configured}>
                    API key
                  </Label>
                  <Input
                    id="shipmondo-api-key"
                    name="shipmondo-api-key"
                    type="password"
                    autoComplete="new-password"
                    placeholder={
                      snapshot.credentials.apiKeyConfigured
                        ? "Leave blank to keep the saved key"
                        : "Your Shipmondo API key"
                    }
                    value={draftApiKey}
                    onChange={(e) => setDraftApiKey(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2 md:max-w-xl">
                <Label htmlFor="shipmondo-module-key">Shipping module key</Label>
                <Input
                  id="shipmondo-module-key"
                  name="shipmondo-module-key"
                  type="password"
                  autoComplete="new-password"
                  placeholder={
                    snapshot.credentials.shippingModuleKeyConfigured
                      ? "Leave blank to keep the saved key • clear input and save to remove"
                      : "Optional shipping module identifier"
                  }
                  value={draftModuleKey}
                  onChange={(e) => setDraftModuleKey(e.target.value)}
                />
                <p className="text-xs text-content-tertiary">
                  Clearing this field and saving removes the shipping module identifier from Shipmondo
                  settings.
                </p>
              </div>

              {formError ? (
                <div
                  role="alert"
                  className="rounded-md border border-feedback-danger-subtle bg-feedback-danger-subtle/40 px-3 py-2 text-sm text-feedback-danger-content"
                >
                  {formError}
                </div>
              ) : null}

              {patch.isError ? (
                <div
                  role="alert"
                  className="rounded-md border border-feedback-danger-subtle bg-feedback-danger-subtle/40 px-3 py-2 text-sm text-feedback-danger-content"
                >
                  {patch.error instanceof Error ? patch.error.message : "Unable to save Shipmondo settings."}
                </div>
              ) : null}

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  type="button"
                  onClick={() => handleSave()}
                  disabled={patch.isPending}
                  className="sm:w-auto"
                >
                  {patch.isPending ? "Saving…" : "Save settings"}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => handleTest()}
                  disabled={test.isPending || !configured}
                  title={
                    configured
                      ? "Send an authenticated Shipmondo shipments probe"
                      : "Save credentials before testing the connection."
                  }
                >
                  {test.isPending ? "Testing connection…" : "Test connection"}
                </Button>
              </div>
            </div>
          </Card>

          {testBanner ? (
            <div
              role="status"
              className={
                testBanner.tone === "success"
                  ? "rounded-md border border-feedback-success-subtle bg-feedback-success-subtle/40 px-4 py-3 text-sm text-feedback-success-content"
                  : "rounded-md border border-feedback-danger-subtle bg-feedback-danger-subtle/40 px-4 py-3 text-sm text-feedback-danger-content"
              }
            >
              {testBanner.message}
            </div>
          ) : null}

          <Card elevation="flat" compact>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-content-primary">Recent tests</p>
                <p className="text-xs text-content-tertiary">
                  Last five probe attempts (success or failure). Shipmondo never logs secrets.
                </p>
              </div>
            </div>

            {snapshot.recentLogs.length === 0 ? (
              <p className="mt-4 text-sm text-content-secondary">No probes recorded yet.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {snapshot.recentLogs.map((log) => (
                  <li
                    key={log.id}
                    className="flex flex-col gap-2 rounded-sm border border-border-subtle bg-surface-subtle p-3 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="space-y-1">
                      <p className="text-sm text-content-primary">{log.message}</p>
                      <p className="text-xs text-content-tertiary">
                        {formatLastTestedAt(log.createdAt)}
                      </p>
                    </div>
                    <Badge variant={log.success ? "success" : "danger"} dot>
                      {log.success ? "Success" : "Failed"}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      ) : null}
    </div>
  )
}
