import type { Dispatch, ReactNode } from "react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/Button"
import { FormField } from "@/components/ui/FormField"
import { Input } from "@/components/ui/Input"
import { ListToolbar } from "@/components/ui/list/ListToolbar"

import type { InventoryOverviewAction } from "./inventoryOverviewState"

type InventoryOverviewFiltersProps = {
  search: string
  filter: "all" | "low_stock"
  thresholdDraft: string
  lowStockThreshold: number
  dispatch: Dispatch<InventoryOverviewAction>
  onSaveThreshold: () => void
}

export function InventoryOverviewFilters({
  search,
  filter,
  thresholdDraft,
  lowStockThreshold,
  dispatch,
  onSaveThreshold,
}: InventoryOverviewFiltersProps): ReactNode {
  return (
    <>
      <ListToolbar
        title="Inventory overview"
        description="Live available = stocked − reserved. Incoming sums open purchase orders."
        end={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/inventory/purchase-orders"
              className="text-sm font-medium text-interactive-primary hover:text-interactive-primary-hover"
            >
              Purchase orders
            </Link>
            <Link
              to="/inventory/suppliers"
              className="text-sm font-medium text-interactive-primary hover:text-interactive-primary-hover"
            >
              Suppliers
            </Link>
          </div>
        }
      />

      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border-default bg-surface-raised p-4">
        <FormField label="Search" htmlFor="inventory-search" className="min-w-48">
          <Input
            id="inventory-search"
            value={search}
            onChange={(event) => {
              dispatch({ type: "setSearch", value: event.target.value })
            }}
            placeholder="Product, SKU, or variant id"
          />
        </FormField>
        <FormField label="Filter" htmlFor="inventory-filter">
          <select
            id="inventory-filter"
            className="rounded-sm border border-border-default bg-surface-base px-3 py-2 text-sm"
            value={filter}
            onChange={(event) => {
              dispatch({
                type: "setFilter",
                value: event.target.value === "low_stock" ? "low_stock" : "all",
              })
            }}
          >
            <option value="all">All variants</option>
            <option value="low_stock">Low stock only</option>
          </select>
        </FormField>
        <div className="flex items-end gap-2">
          <FormField label="Low-stock threshold" htmlFor="inventory-threshold">
            <Input
              id="inventory-threshold"
              type="number"
              min={0}
              step={1}
              className="w-24"
              value={thresholdDraft}
              onChange={(event) =>
                dispatch({ type: "setThresholdDraft", value: event.target.value })
              }
            />
          </FormField>
          <Button type="button" size="sm" onClick={onSaveThreshold}>
            Save
          </Button>
        </div>
        <p className="text-xs text-content-tertiary">
          Highlight when available &lt; {lowStockThreshold}
        </p>
      </div>
    </>
  )
}
