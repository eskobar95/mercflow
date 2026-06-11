import { type ReactNode, useState } from "react"

import { CustomDataEntitySidebar } from "@/components/metafields/CustomDataEntitySidebar"
import { MetafieldDefinitionFormSheet } from "@/components/metafields/MetafieldDefinitionFormSheet"
import { StandardLibraryBrowseDialog } from "@/components/metafields/StandardLibraryBrowseDialog"
import { Button } from "@/components/ui/Button"
import { DataTable } from "@/components/ui/list/DataTable"
import { ListEmptyState } from "@/components/ui/list/ListEmptyState"
import { PageHeader } from "@/components/ui/PageHeader"
import { Select } from "@/components/ui/Select"
import type { CustomDataEntityKey, CustomDataListTab } from "@/features/metafields/types"

import { settingsCustomDataBreadcrumbs } from "@/config/settingsBreadcrumbs"

import { useCustomDataSettingsPage } from "./useCustomDataSettingsPage"

function listTabButtonClass(isActive: boolean): string {
  return `border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
    isActive
      ? "border-interactive-primary text-content-primary"
      : "border-transparent text-content-secondary hover:text-content-primary"
  }`
}

export function CustomDataSettingsPage(): ReactNode {
  const [libraryDialogOpen, setLibraryDialogOpen] = useState(false)
  const {
    hasBackend,
    state,
    dispatch,
    ownerType,
    entityLabel,
    showByCategoryTab,
    requireCategoryConstraint,
    canLoadDefinitions,
    columns,
    getRowActions,
    sortedRows,
    onRequestSort,
    reload,
    submitCreate,
    submitUpdate,
    categoryRows,
  } = useCustomDataSettingsPage()

  const {
    entity,
    listTab,
    categoryFilterId,
    phase,
    message,
    sheetOpen,
    sheetMode,
    editingDefinition,
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
          manage custom data definitions.
        </p>
      </div>
    )
  }

  const categorySelectOptions = categoryRows.map((row) => ({
    value: row.id,
    label: `${"— ".repeat(row.depth)}${row.name}`,
  }))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Custom data"
        description="Define structured fields for products and categories — no code required."
        breadcrumbs={settingsCustomDataBreadcrumbs()}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={entity === "variant" || entity === "order" || entity === "customer"}
              title={
                entity === "variant" || entity === "order" || entity === "customer"
                  ? "Coming soon for this entity"
                  : undefined
              }
              onClick={() => {
                setLibraryDialogOpen(true)
              }}
            >
              Browse standard library
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={() => {
                dispatch({ type: "openCreateSheet" })
              }}
            >
              Add definition
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[12rem_1fr]">
        <aside className="rounded-lg border border-border-subtle bg-surface-raised p-2">
          <CustomDataEntitySidebar
            activeEntity={entity}
            onSelectEntity={(next: CustomDataEntityKey) => {
              dispatch({ type: "setEntity", entity: next })
            }}
          />
        </aside>

        <section className="space-y-4">
          {showByCategoryTab ? (
            <div
              role="tablist"
              aria-label={`${entityLabel} definition views`}
              className="flex flex-wrap gap-1 border-b border-border-subtle"
            >
              <button
                type="button"
                role="tab"
                aria-selected={listTab === "all"}
                className={listTabButtonClass(listTab === "all")}
                onClick={() => {
                  dispatch({ type: "setListTab", tab: "all" satisfies CustomDataListTab })
                }}
              >
                All {entityLabel}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={listTab === "by_category"}
                className={listTabButtonClass(listTab === "by_category")}
                onClick={() => {
                  dispatch({ type: "setListTab", tab: "by_category" satisfies CustomDataListTab })
                }}
              >
                By category
              </button>
            </div>
          ) : (
            <h2 className="text-base font-semibold text-content-primary">All {entityLabel}</h2>
          )}

          {listTab === "by_category" ? (
            <div className="max-w-md">
              <Select
                value={categoryFilterId}
                placeholder="Select category…"
                options={categorySelectOptions}
                aria-label="Filter by category"
                onValueChange={(value) => {
                  dispatch({ type: "setCategoryFilterId", categoryId: value })
                }}
              />
            </div>
          ) : null}

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
          ) : !canLoadDefinitions ? (
            <ListEmptyState
              title="Select a category"
              description="Choose a category above to view and manage category-scoped product definitions."
            />
          ) : (
            <DataTable
              aria-label="Metafield definitions"
              caption="Custom data definitions"
              columns={columns}
              data={sortedRows}
              getRowId={(row) => row.id}
              sortState={sort}
              onRequestSort={onRequestSort}
              getRowActions={getRowActions}
              isLoading={phase === "loading"}
              emptyState={
                <ListEmptyState
                  title="No definitions yet"
                  description="Add a definition to start collecting structured data on your catalogue."
                  action={
                    <Button
                      type="button"
                      variant="primary"
                      onClick={() => {
                        dispatch({ type: "openCreateSheet" })
                      }}
                    >
                      Add definition
                    </Button>
                  }
                />
              }
            />
          )}
        </section>
      </div>

      {entity === "product" || entity === "category" ? (
        <StandardLibraryBrowseDialog
          open={libraryDialogOpen}
          onOpenChange={setLibraryDialogOpen}
          ownerType={ownerType}
          onActivated={reload}
        />
      ) : null}

      <MetafieldDefinitionFormSheet
        open={sheetOpen}
        mode={sheetMode}
        ownerType={ownerType}
        definition={editingDefinition}
        requireCategoryConstraint={requireCategoryConstraint}
        defaultCategoryConstraintId={categoryFilterId}
        categoryRows={categoryRows}
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
