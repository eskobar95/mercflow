import type { Dispatch, ReactNode } from "react"

import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"
import { Switch } from "@/components/ui/Switch"
import type { ShipmondoConnectorGetDto } from "@/features/connectors/shipmondoTypes"

import type { ShipmondoWorkspaceAction } from "./shipmondoWorkspaceState"

type ShipmondoCredentialsCardProps = {
  snapshot: ShipmondoConnectorGetDto
  configured: boolean
  draftActive: boolean
  draftApiUser: string
  draftApiKey: string
  draftModuleKey: string
  formError: string | null
  patchIsPending: boolean
  patchError: Error | null
  testIsPending: boolean
  dispatch: Dispatch<ShipmondoWorkspaceAction>
  onSave: () => void
  onTest: () => void
}

export function ShipmondoCredentialsCard({
  snapshot,
  configured,
  draftActive,
  draftApiUser,
  draftApiKey,
  draftModuleKey,
  formError,
  patchIsPending,
  patchError,
  testIsPending,
  dispatch,
  onSave,
  onTest,
}: ShipmondoCredentialsCardProps): ReactNode {
  return (
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
            onCheckedChange={(v) => dispatch({ type: "setDraftActive", value: v === true })}
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
              onChange={(e) => dispatch({ type: "setDraftApiUser", value: e.target.value })}
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
              onChange={(e) => dispatch({ type: "setDraftApiKey", value: e.target.value })}
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
            onChange={(e) => dispatch({ type: "setDraftModuleKey", value: e.target.value })}
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

        {patchError !== null ? (
          <div
            role="alert"
            className="rounded-md border border-feedback-danger-subtle bg-feedback-danger-subtle/40 px-3 py-2 text-sm text-feedback-danger-content"
          >
            {patchError.message}
          </div>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            type="button"
            onClick={onSave}
            disabled={patchIsPending}
            className="sm:w-auto"
          >
            {patchIsPending ? "Saving…" : "Save settings"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={onTest}
            disabled={testIsPending || !configured}
            title={
              configured
                ? "Send an authenticated Shipmondo shipments probe"
                : "Save credentials before testing the connection."
            }
          >
            {testIsPending ? "Testing connection…" : "Test connection"}
          </Button>
        </div>
      </div>
    </Card>
  )
}
