import type { ReactNode } from "react"
import type { FormEvent } from "react"

import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { FormField } from "@/components/ui/FormField"
import { Input } from "@/components/ui/Input"
import { PageHeader } from "@/components/ui/PageHeader"
import { Spinner } from "@/components/ui/Spinner"
import { Switch } from "@/components/ui/Switch"
import { settingsSubscriptionsBreadcrumbs } from "@/config/settingsBreadcrumbs"

import { useSubscriptionsSettingsPage } from "./useSubscriptionsSettingsPage"

export function SubscriptionsSettingsPage(): ReactNode {
  const { hasBackend, state, dispatch, reload, handleSave, previewMonthly, previewAnnual } =
    useSubscriptionsSettingsPage()

  const { phase, message, clubEnabled, clubName, clubPriceMonthly, clubPriceAnnual, clubFallbackDiscountPct, saving } =
    state

  if (!hasBackend) {
    return (
      <div className="p-6">
        <p className="text-sm text-content-secondary">
          Configure{" "}
          <code className="rounded bg-surface-subtle px-1">VITE_MEDUSA_ADMIN_BACKEND_URL</code> to
          manage Customer Club settings.
        </p>
      </div>
    )
  }

  if (phase === "loading" || phase === "idle") {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-8" aria-busy aria-live="polite">
        <Spinner label="Loading subscription settings" />
      </div>
    )
  }

  if (phase === "error") {
    return (
      <div className="p-6" role="alert">
        <PageHeader title="Subscriptions" breadcrumbs={settingsSubscriptionsBreadcrumbs()} />
        <Card className="mt-6 p-6">
          <p className="font-medium text-content-primary">Could not reach the backend.</p>
          <p className="mt-2 text-sm text-content-secondary">{message}</p>
          <Button
            type="button"
            variant="secondary"
            className="mt-6"
            onClick={() => {
              void reload()
            }}
          >
            Try again
          </Button>
        </Card>
      </div>
    )
  }

  const onSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
    void handleSave()
  }

  return (
    <div className="pb-24">
      <PageHeader
        title="Subscriptions"
        description="Configure your Customer Club membership — name, pricing, and fallback member discount."
        breadcrumbs={settingsSubscriptionsBreadcrumbs()}
      />

      <form
        className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-10 sm:px-6"
        onSubmit={onSubmit}
      >
        <Card className="space-y-6 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-content-primary">Enable Customer Club</h2>
              <p className="mt-1 text-sm text-content-secondary">
                When enabled, customers can purchase a recurring membership and receive member
                pricing across your catalogue.
              </p>
            </div>
            <Switch
              checked={clubEnabled}
              aria-label="Enable Customer Club"
              onCheckedChange={(checked) => {
                dispatch({ type: "setClubEnabled", value: checked })
              }}
            />
          </div>

          {clubEnabled ? (
            <div className="space-y-4 border-t border-border-subtle pt-6">
              <FormField label="Club name" htmlFor="club-name" required>
                <Input
                  id="club-name"
                  value={clubName}
                  placeholder="e.g. VIP Klub"
                  onChange={(event) => {
                    dispatch({ type: "setClubName", value: event.target.value })
                  }}
                />
              </FormField>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Monthly price (DKK)" htmlFor="club-price-monthly" required>
                  <Input
                    id="club-price-monthly"
                    inputMode="decimal"
                    value={clubPriceMonthly}
                    placeholder="89"
                    onChange={(event) => {
                      dispatch({ type: "setClubPriceMonthly", value: event.target.value })
                    }}
                  />
                </FormField>

                <FormField label="Annual price (DKK)" htmlFor="club-price-annual" required>
                  <Input
                    id="club-price-annual"
                    inputMode="decimal"
                    value={clubPriceAnnual}
                    placeholder="890"
                    onChange={(event) => {
                      dispatch({ type: "setClubPriceAnnual", value: event.target.value })
                    }}
                  />
                </FormField>
              </div>

              <FormField
                label="Fallback member discount (%)"
                htmlFor="club-fallback-discount"
                hint="Applied when a product has no explicit member price"
              >
                <Input
                  id="club-fallback-discount"
                  inputMode="decimal"
                  value={clubFallbackDiscountPct}
                  placeholder="10"
                  onChange={(event) => {
                    dispatch({ type: "setClubFallbackDiscountPct", value: event.target.value })
                  }}
                />
              </FormField>
            </div>
          ) : null}
        </Card>

        {clubEnabled ? (
          <Card className="p-6">
            <h2 className="text-sm font-semibold text-content-primary">Storefront preview</h2>
            <p className="mt-2 text-sm text-content-secondary">
              Customers see {previewMonthly} DKK/month or {previewAnnual} DKK/year
              {clubName.trim() !== "" ? (
                <>
                  {" "}
                  to join <span className="font-medium text-content-primary">{clubName.trim()}</span>
                </>
              ) : null}
              .
            </p>
          </Card>
        ) : null}

        {message !== null ? (
          <p
            role="status"
            className={`text-sm ${message.includes("saved") ? "text-content-secondary" : "text-content-danger"}`}
          >
            {message}
          </p>
        ) : null}

        <div className="flex justify-end">
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? "Saving…" : "Save settings"}
          </Button>
        </div>
      </form>
    </div>
  )
}
