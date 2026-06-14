import type { ReactNode } from "react"

import { Button } from "@/components/ui/Button"
import { DataTable } from "@/components/ui/list/DataTable"
import { ListEmptyState } from "@/components/ui/list/ListEmptyState"
import { Label } from "@/components/ui/Label"
import { PageHeader } from "@/components/ui/PageHeader"
import { Select } from "@/components/ui/Select"
import { Spinner } from "@/components/ui/Spinner"
import { settingsShippingProfilesBreadcrumbs } from "@/config/settingsBreadcrumbs"

import { ShippingProfileSheet } from "./ShippingProfileSheet"
import { ShippingRateSheet } from "./ShippingRateSheet"
import { useShippingSettingsPage } from "./useShippingSettingsPage"

function tabClass(active: boolean): string {
  return `border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
    active
      ? "border-interactive-primary text-content-primary"
      : "border-transparent text-content-secondary hover:text-content-primary"
  }`
}

export function ShippingSettingsPage(): ReactNode {
  const page = useShippingSettingsPage()
  const { hasBackend, state, dispatch, reload, submitProfile, submitRate } = page
  const {
    phase,
    message,
    activeTab,
    profiles,
    selectedProfileId,
    ratesLoading,
    setup,
    profileSheetOpen,
    profileSheetMode,
    editingProfile,
    profileSaving,
    profileSheetError,
    rateSheetOpen,
    rateSheetMode,
    editingRate,
    rateSaving,
    rateSheetError,
  } = state

  if (!hasBackend) {
    return (
      <div className="p-6">
        <p className="text-sm text-content-secondary">
          Configure{" "}
          <code className="rounded bg-surface-subtle px-1">VITE_MEDUSA_ADMIN_BACKEND_URL</code> to
          manage shipping settings.
        </p>
      </div>
    )
  }

  if (phase === "loading") {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-8" aria-busy aria-live="polite">
        <Spinner label="Loading shipping settings" />
      </div>
    )
  }

  if (phase === "error") {
    return (
      <div className="p-6" role="alert">
        <PageHeader title="Shipping profiles" breadcrumbs={settingsShippingProfilesBreadcrumbs()} />
        <div className="mt-6 rounded-lg border border-border-subtle bg-surface-default p-6 shadow-sm">
          <p className="font-medium text-content-primary">Could not load shipping settings.</p>
          <p className="mt-2 text-sm text-content-secondary">{message}</p>
          <Button type="button" variant="secondary" className="mt-6" onClick={() => void reload()}>
            Try again
          </Button>
        </div>
      </div>
    )
  }

  const noopSort = (): void => {}

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Shipping profiles"
        description="Manage shipping profiles and the flat or calculated rates customers see at checkout."
        breadcrumbs={settingsShippingProfilesBreadcrumbs()}
        actions={
          activeTab === "profiles" ? (
            <Button type="button" onClick={() => dispatch({ type: "openCreateProfileSheet" })}>
              Add profile
            </Button>
          ) : (
            <Button
              type="button"
              disabled={!selectedProfileId || !setup}
              onClick={() => dispatch({ type: "openCreateRateSheet" })}
            >
              Add rate
            </Button>
          )
        }
      />

      <div role="tablist" aria-label="Shipping settings sections" className="flex gap-1 border-b border-border-subtle">
        <button type="button" role="tab" aria-selected={activeTab === "profiles"} className={tabClass(activeTab === "profiles")} onClick={() => dispatch({ type: "setActiveTab", tab: "profiles" })}>
          Profiles
        </button>
        <button type="button" role="tab" aria-selected={activeTab === "rates"} className={tabClass(activeTab === "rates")} onClick={() => dispatch({ type: "setActiveTab", tab: "rates" })}>
          Rates
        </button>
      </div>

      {message ? <p role="alert" className="text-sm text-feedback-danger-content">{message}</p> : null}

      {activeTab === "profiles" ? (
        <DataTable
          aria-label="Shipping profiles"
          caption="Medusa shipping profiles"
          columns={page.profileColumns}
          data={page.profileRows}
          getRowId={(row) => row.id}
          getRowActions={page.getProfileRowActions}
          sortState={{ column: null, direction: "none" }}
          onRequestSort={noopSort}
          emptyState={
            <ListEmptyState
              title="No shipping profiles yet"
              description="Create a profile to group products that share the same shipping rates."
              action={<Button type="button" onClick={() => dispatch({ type: "openCreateProfileSheet" })}>Add profile</Button>}
            />
          }
        />
      ) : (
        <div className="space-y-4">
          <div className="max-w-md space-y-2">
            <Label htmlFor="shipping-profile-filter">Profile</Label>
            <Select
              id="shipping-profile-filter"
              value={selectedProfileId ?? ""}
              options={profiles.map((p) => ({ value: p.id, label: p.name }))}
              placeholder={profiles.length ? "Select a profile" : "No profiles available"}
              onValueChange={(value) => dispatch({ type: "setSelectedProfileId", profileId: value || null })}
            />
          </div>
          {!setup ? (
            <p className="text-sm text-content-secondary">
              Add a stock location with a service zone and at least one sales region in Medusa before creating flat shipping rates here.
            </p>
          ) : null}
          <DataTable
            aria-label="Shipping rates"
            caption="Shipping options for the selected profile"
            columns={page.rateColumns}
            data={page.rateRows}
            getRowId={(row) => row.id}
            getRowActions={page.getRateRowActions}
            isLoading={ratesLoading}
            sortState={{ column: null, direction: "none" }}
            onRequestSort={noopSort}
            emptyState={
              <ListEmptyState
                title={selectedProfileId ? "No shipping rates for this profile" : "Select a shipping profile"}
                description={selectedProfileId ? "Add a flat rate that shoppers can select during checkout." : "Choose a profile above to view and manage its rates."}
                action={selectedProfileId && setup ? <Button type="button" onClick={() => dispatch({ type: "openCreateRateSheet" })}>Add rate</Button> : undefined}
              />
            }
          />
        </div>
      )}

      <ShippingProfileSheet
        open={profileSheetOpen}
        mode={profileSheetMode}
        profile={editingProfile}
        saving={profileSaving}
        errorMessage={profileSheetError}
        onOpenChange={(open) => { if (!open) dispatch({ type: "closeProfileSheet" }) }}
        onSubmit={submitProfile}
      />
      <ShippingRateSheet
        open={rateSheetOpen}
        mode={rateSheetMode}
        rate={editingRate}
        saving={rateSaving}
        errorMessage={rateSheetError}
        onOpenChange={(open) => { if (!open) dispatch({ type: "closeRateSheet" }) }}
        onSubmit={submitRate}
      />
    </div>
  )
}
