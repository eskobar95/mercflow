import type { ReactNode } from "react"

import { Button } from "@/components/ui/Button"
import { DataTable } from "@/components/ui/list/DataTable"
import { ListEmptyState } from "@/components/ui/list/ListEmptyState"
import { PageHeader } from "@/components/ui/PageHeader"
import { Spinner } from "@/components/ui/Spinner"
import { useToast } from "@/components/ui/Toast"

import { settingsTaxesBreadcrumbs } from "@/config/settingsBreadcrumbs"

import { TaxRegionDeleteDialog } from "./TaxRegionDeleteDialog"
import { TaxRegionFormSheet } from "./TaxRegionFormSheet"
import { useTaxesSettingsPage } from "./useTaxesSettingsPage"

export function TaxesSettingsPage(): ReactNode {
  const { toast } = useToast()
  const {
    hasBackend,
    state,
    dispatch,
    columns,
    getRowActions,
    sortedRows,
    onRequestSort,
    reload,
    submitCreate,
    submitUpdate,
    confirmDelete,
  } = useTaxesSettingsPage()

  const {
    phase,
    message,
    sheetOpen,
    sheetMode,
    editingRegion,
    saving,
    sheetError,
    deleteDialogOpen,
    deletingRegion,
    deleting,
    sort,
  } = state

  const notifySuccess = (title: string, description: string): void => {
    toast({ title, description, variant: "success" })
  }

  if (!hasBackend) {
    return (
      <div className="p-6">
        <p className="text-sm text-content-secondary">
          Configure{" "}
          <code className="rounded bg-surface-subtle px-1">VITE_MEDUSA_ADMIN_BACKEND_URL</code> to manage tax settings.
        </p>
      </div>
    )
  }

  if (phase === "loading") {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-8" aria-busy aria-live="polite">
        <Spinner label="Loading tax settings" />
      </div>
    )
  }

  if (phase === "error") {
    return (
      <div className="space-y-6 p-6">
        <PageHeader
          title="Taxes"
          description="Configure tax regions and default rates for each country you sell in."
          breadcrumbs={settingsTaxesBreadcrumbs()}
        />
        <div role="alert" className="rounded-lg border border-interactive-danger-subtle bg-surface-subtle px-4 py-3">
          <p className="font-medium text-content-primary">Could not load tax regions.</p>
          <p className="mt-1 text-sm text-content-secondary">{message}</p>
          <Button type="button" variant="secondary" className="mt-4" onClick={() => void reload()}>
            Try again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Taxes"
        description="Configure tax regions and default rates for each country you sell in."
        breadcrumbs={settingsTaxesBreadcrumbs()}
        actions={
          <Button type="button" variant="primary" onClick={() => dispatch({ type: "openCreateSheet" })}>
            Add tax region
          </Button>
        }
      />

      {message !== null ? (
        <div
          role="alert"
          className="rounded-lg border border-interactive-danger-subtle bg-surface-subtle px-4 py-3 text-sm text-content-danger"
        >
          {message}
        </div>
      ) : null}

      <DataTable
        aria-label="Tax regions"
        caption="Configured tax regions"
        columns={columns}
        data={sortedRows}
        getRowId={(row) => row.id}
        sortState={sort}
        onRequestSort={onRequestSort}
        getRowActions={getRowActions}
        emptyState={
          <ListEmptyState
            title="No tax regions"
            description="No tax regions — add one to charge the right tax at checkout."
            action={
              <Button type="button" variant="primary" onClick={() => dispatch({ type: "openCreateSheet" })}>
                Add tax region
              </Button>
            }
          />
        }
      />

      <TaxRegionFormSheet
        open={sheetOpen}
        mode={sheetMode}
        region={editingRegion}
        saving={saving}
        errorMessage={sheetError}
        onOpenChange={(open) => {
          if (!open) dispatch({ type: "closeSheet" })
        }}
        onSubmitCreate={async (input) => {
          if (await submitCreate(input)) {
            notifySuccess("Tax region added", "The new tax region is active for checkout.")
          }
        }}
        onSubmitUpdate={async (input) => {
          if (await submitUpdate(input)) {
            notifySuccess("Tax region updated", "Your tax rate changes were saved.")
          }
        }}
      />

      <TaxRegionDeleteDialog
        open={deleteDialogOpen}
        region={deletingRegion}
        deleting={deleting}
        onOpenChange={(open) => {
          if (!open) dispatch({ type: "closeDeleteDialog" })
        }}
        onConfirm={async () => {
          if (await confirmDelete()) {
            notifySuccess("Tax region deleted", "The tax region was removed.")
          }
        }}
      />
    </div>
  )
}
