import type { ReactNode } from "react"

import { PackagingTypeFormSheet } from "@/components/packaging/PackagingTypeFormSheet"
import { Button } from "@/components/ui/Button"
import { DataTable } from "@/components/ui/list/DataTable"
import { ListEmptyState } from "@/components/ui/list/ListEmptyState"
import { PageHeader } from "@/components/ui/PageHeader"

import { settingsPackagingBreadcrumbs } from "@/config/settingsBreadcrumbs"

import { usePackagingSettingsPage } from "./usePackagingSettingsPage"

export function PackagingSettingsPage(): ReactNode {
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
  } = usePackagingSettingsPage()

  const {
    phase,
    message,
    sheetOpen,
    sheetMode,
    editingPackagingType,
    saving,
    sheetError,
    sort,
  } = state

  if (!hasBackend) {
    return (
      <div className="p-6">
        <p className="text-sm text-content-secondary">
          Configure{" "}
          <code className="rounded bg-surface-subtle px-1">VITE_MEDUSA_ADMIN_BACKEND_URL</code> to
          manage packaging types.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Packaging"
        description="Register boxes, envelopes, and bags used when fulfilling orders."
        breadcrumbs={settingsPackagingBreadcrumbs()}
        actions={
          <Button
            type="button"
            variant="primary"
            onClick={() => {
              dispatch({ type: "openCreateSheet" })
            }}
          >
            Add packaging type
          </Button>
        }
      />

      {message !== null && phase === "ready" ? (
        <p role="alert" className="text-sm text-content-danger">
          {message}
        </p>
      ) : null}

      {phase === "error" ? (
        <div role="alert" className="text-sm text-content-danger">
          {message}
          <Button
            type="button"
            variant="secondary"
            className="mt-4"
            onClick={() => {
              void reload()
            }}
          >
            Retry
          </Button>
        </div>
      ) : (
        <DataTable
          aria-label="Packaging types"
          caption="MercFlow packaging catalog"
          columns={columns}
          data={sortedRows}
          getRowId={(row) => row.id}
          sortState={sort}
          onRequestSort={onRequestSort}
          getRowActions={getRowActions}
          isLoading={phase === "loading"}
          emptyState={
            <ListEmptyState
              title="No packaging types added yet"
              description="Add your first box, envelope, or bag so MercFlow can suggest the right packaging during fulfillment."
              action={
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => {
                    dispatch({ type: "openCreateSheet" })
                  }}
                >
                  Add packaging type
                </Button>
              }
            />
          }
        />
      )}

      <PackagingTypeFormSheet
        open={sheetOpen}
        mode={sheetMode}
        packagingType={editingPackagingType}
        saving={saving}
        errorMessage={sheetError}
        onOpenChange={(open) => {
          if (!open) {
            dispatch({ type: "closeSheet" })
          }
        }}
        onSubmitCreate={submitCreate}
        onSubmitUpdate={submitUpdate}
      />
    </div>
  )
}
