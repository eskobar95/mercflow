import { type ReactNode, useCallback, useEffect, useMemo, useReducer, type FormEvent } from "react"

import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { FormField } from "@/components/ui/FormField"
import { Input } from "@/components/ui/Input"
import { PageHeader } from "@/components/ui/PageHeader"
import { Textarea } from "@/components/ui/Textarea"
import { DataTable } from "@/components/ui/list/DataTable"
import { ListEmptyState } from "@/components/ui/list/ListEmptyState"
import type { ListColumnDef, ListSortState } from "@/components/ui/list/types"
import {
  getAdminFeedConfig,
  getAdminFeedValidation,
  putAdminFeedConfig,
} from "@/features/feed/feedApi"
import type {
  FeedAdminOverviewDto,
  FeedConfigDto,
  FeedValidationIssueDto,
} from "@/features/feed/types"

type ValidationCol = "product" | "variant" | "missing"

const VALIDATION_COLUMNS: ListColumnDef<FeedValidationIssueDto, ValidationCol>[] = [
  {
    id: "product",
    header: "Product",
    sortable: true,
    getSortValue: (row) => row.product_title ?? row.product_id,
    renderCell: (row) => (
      <div className="flex min-w-0 flex-col">
        <span className="truncate font-medium">
          {row.product_title ?? "Untitled"}
        </span>
        <span className="truncate text-xs text-content-tertiary">{row.product_id}</span>
      </div>
    ),
  },
  {
    id: "variant",
    header: "Variant",
    sortable: true,
    getSortValue: (row) => row.variant_sku ?? "",
    renderCell: (row) =>
      row.variant_sku ? (
        <span className="font-mono text-xs">{row.variant_sku}</span>
      ) : (
        <span className="text-content-tertiary">—</span>
      ),
  },
  {
    id: "missing",
    header: "Missing fields",
    renderCell: (row) => row.missing_fields.join(", "),
  },
]

function parseIdLines(value: string): string[] {
  const parts = value.split(/[\n,]+/)
  const ids: string[] = []
  for (const part of parts) {
    const trimmed = part.trim()
    if (trimmed.length > 0) {
      ids.push(trimmed)
    }
  }
  return ids
}

function formatIdLines(ids: string[]): string {
  return ids.join("\n")
}

function formatTimestamp(iso: string | null): string {
  if (iso === null) {
    return "Not cached yet"
  }
  try {
    return new Date(iso).toLocaleString("da-DK", {
      dateStyle: "medium",
      timeStyle: "short",
    })
  } catch {
    return iso
  }
}

type FeedOverviewState = {
  phase: "loading" | "ready" | "error"
  message: string | null
  config: FeedConfigDto | null
  overview: FeedAdminOverviewDto | null
  storefrontUrl: string
  excludedProducts: string
  excludedCategories: string
  saving: boolean
  copyState: "idle" | "copied" | "failed"
  validationRows: FeedValidationIssueDto[]
  validationPhase: "loading" | "ready" | "error"
  sort: ListSortState<ValidationCol>
}

type FeedOverviewAction =
  | { type: "reloadStart" }
  | { type: "reloadSuccess"; payload: Pick<FeedOverviewState, "config" | "overview" | "storefrontUrl" | "excludedProducts" | "excludedCategories"> }
  | { type: "reloadError"; message: string }
  | { type: "setMessage"; message: string | null }
  | { type: "setStorefrontUrl"; value: string }
  | { type: "setExcludedProducts"; value: string }
  | { type: "setExcludedCategories"; value: string }
  | { type: "saveStart" }
  | { type: "saveFinish" }
  | { type: "saveSuccess"; config: FeedConfigDto | null; overview: FeedAdminOverviewDto | null }
  | { type: "setCopyState"; value: FeedOverviewState["copyState"] }
  | { type: "validationStart" }
  | { type: "validationSuccess"; rows: FeedValidationIssueDto[] }
  | { type: "validationError" }
  | { type: "cycleSort"; columnId: ValidationCol }

const INITIAL_FEED_OVERVIEW_STATE: FeedOverviewState = {
  phase: "loading",
  message: null,
  config: null,
  overview: null,
  storefrontUrl: "",
  excludedProducts: "",
  excludedCategories: "",
  saving: false,
  copyState: "idle",
  validationRows: [],
  validationPhase: "loading",
  sort: { column: "product", direction: "asc" },
}

function feedOverviewReducer(state: FeedOverviewState, action: FeedOverviewAction): FeedOverviewState {
  switch (action.type) {
    case "reloadStart":
      return { ...state, phase: "loading", message: null }
    case "reloadSuccess":
      return { ...state, ...action.payload, phase: "ready" }
    case "reloadError":
      return { ...state, phase: "error", message: action.message }
    case "setMessage":
      return { ...state, message: action.message }
    case "setStorefrontUrl":
      return { ...state, storefrontUrl: action.value }
    case "setExcludedProducts":
      return { ...state, excludedProducts: action.value }
    case "setExcludedCategories":
      return { ...state, excludedCategories: action.value }
    case "saveStart":
      return { ...state, saving: true, message: null }
    case "saveFinish":
      return { ...state, saving: false }
    case "saveSuccess":
      return { ...state, config: action.config, overview: action.overview }
    case "setCopyState":
      return { ...state, copyState: action.value }
    case "validationStart":
      return { ...state, validationPhase: "loading" }
    case "validationSuccess":
      return { ...state, validationRows: action.rows, validationPhase: "ready" }
    case "validationError":
      return { ...state, validationRows: [], validationPhase: "error" }
    case "cycleSort": {
      const { columnId } = action
      const { sort } = state
      if (sort.column !== columnId) {
        return { ...state, sort: { column: columnId, direction: "asc" } }
      }
      if (sort.direction === "asc") {
        return { ...state, sort: { column: columnId, direction: "desc" } }
      }
      return { ...state, sort: { column: null, direction: "none" } }
    }
    default:
      return state
  }
}

export function FeedOverviewPage(): ReactNode {
  const [state, dispatch] = useReducer(feedOverviewReducer, INITIAL_FEED_OVERVIEW_STATE)
  const {
    phase,
    message,
    config,
    overview,
    storefrontUrl,
    excludedProducts,
    excludedCategories,
    saving,
    copyState,
    validationRows,
    validationPhase,
    sort,
  } = state

  const reload = useCallback(async (): Promise<void> => {
    dispatch({ type: "reloadStart" })
    try {
      const payload = await getAdminFeedConfig()
      dispatch({
        type: "reloadSuccess",
        payload: {
          config: payload.feed_config,
          overview: payload.overview,
          storefrontUrl: payload.feed_config?.storefront_url ?? "",
          excludedProducts: formatIdLines(payload.feed_config?.excluded_product_ids ?? []),
          excludedCategories: formatIdLines(payload.feed_config?.excluded_category_ids ?? []),
        },
      })
    } catch (err: unknown) {
      dispatch({
        type: "reloadError",
        message: err instanceof Error ? err.message : "Failed to load feed settings",
      })
    }
  }, [])

  const reloadValidation = useCallback(async (): Promise<void> => {
    dispatch({ type: "validationStart" })
    try {
      const report = await getAdminFeedValidation()
      dispatch({ type: "validationSuccess", rows: report.validation.issues })
    } catch {
      dispatch({ type: "validationError" })
    }
  }, [])

  useEffect(() => {
    void reload()
    void reloadValidation()
  }, [reload, reloadValidation])

  const sortedValidation = useMemo(() => {
    const col = sort.column
    if (col === null || sort.direction === "none") {
      return validationRows
    }
    const def = VALIDATION_COLUMNS.find((c) => c.id === col)
    const dir = sort.direction === "asc" ? 1 : -1
    return validationRows.toSorted((a, b) => {
      const av = def?.getSortValue?.(a) ?? ""
      const bv = def?.getSortValue?.(b) ?? ""
      return String(av).localeCompare(String(bv)) * dir
    })
  }, [validationRows, sort])

  const onRequestSort = (columnId: ValidationCol): void => {
    dispatch({ type: "cycleSort", columnId })
  }

  const handleSave = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    dispatch({ type: "saveStart" })
    try {
      const payload = await putAdminFeedConfig({
        storefront_url: storefrontUrl.trim() === "" ? null : storefrontUrl.trim(),
        excluded_product_ids: parseIdLines(excludedProducts),
        excluded_category_ids: parseIdLines(excludedCategories),
      })
      dispatch({
        type: "saveSuccess",
        config: payload.feed_config,
        overview: payload.overview,
      })
      await reloadValidation()
    } catch (err: unknown) {
      dispatch({
        type: "setMessage",
        message: err instanceof Error ? err.message : "Failed to save feed settings",
      })
    } finally {
      dispatch({ type: "saveFinish" })
    }
  }

  const handleCopyFeedUrl = async (): Promise<void> => {
    const url = overview?.feed_url
    if (url === null || url === undefined || url === "") {
      dispatch({ type: "setCopyState", value: "failed" })
      return
    }
    try {
      await navigator.clipboard.writeText(url)
      dispatch({ type: "setCopyState", value: "copied" })
    } catch {
      dispatch({ type: "setCopyState", value: "failed" })
    }
  }

  const feedUrl = overview?.feed_url ?? null

  return (
    <div className="space-y-6">
      <PageHeader
        title="Google Shopping feed"
        description="Feed URL, catalogue exclusions, and validation for Merchant Center."
      />

      {phase === "error" ? (
        <div role="alert" className="text-sm text-feedback-danger-content">
          {message}
          <Button type="button" variant="secondary" className="mt-4" onClick={() => void reload()}>
            Retry
          </Button>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card compact>
              <p className="text-xs font-medium text-content-tertiary">Products in feed</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-content-primary">
                {phase === "loading" ? "…" : (overview?.product_count ?? 0)}
              </p>
            </Card>
            <Card compact>
              <p className="text-xs font-medium text-content-tertiary">Variants in feed</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-content-primary">
                {phase === "loading" ? "…" : (overview?.variant_count ?? 0)}
              </p>
            </Card>
            <Card compact>
              <p className="text-xs font-medium text-content-tertiary">Validation issues</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-content-primary">
                {phase === "loading" ? "…" : (overview?.validation_issue_count ?? 0)}
              </p>
            </Card>
            <Card compact>
              <p className="text-xs font-medium text-content-tertiary">Feed cache updated</p>
              <p className="mt-1 text-sm font-medium text-content-primary">
                {phase === "loading"
                  ? "…"
                  : formatTimestamp(overview?.last_updated_at ?? null)}
              </p>
            </Card>
          </div>

          <Card className="space-y-4">
            <h2 className="text-lg font-semibold text-content-primary">Public feed URL</h2>
            <p className="text-sm text-content-secondary">
              Paste this URL into Google Merchant Center. Requires a configured storefront URL.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Input
                readOnly
                value={feedUrl ?? ""}
                placeholder="Set storefront URL below to generate feed URL"
                aria-label="Public feed URL"
              />
              <Button
                type="button"
                variant="secondary"
                disabled={feedUrl === null || feedUrl === ""}
                onClick={() => void handleCopyFeedUrl()}
              >
                Copy URL
              </Button>
            </div>
            {copyState === "copied" ? (
              <p className="text-sm text-feedback-success-content" role="status">
                Copied to clipboard.
              </p>
            ) : null}
            {copyState === "failed" ? (
              <p className="text-sm text-feedback-danger-content" role="alert">
                Could not copy — check storefront URL or browser permissions.
              </p>
            ) : null}
          </Card>

          <Card className="space-y-4">
            <h2 className="text-lg font-semibold text-content-primary">Exclusions & storefront</h2>
            <form className="grid gap-4" onSubmit={(e) => void handleSave(e)}>
              <FormField label="Storefront URL" hint="Base URL for product links in the feed.">
                <Input
                  value={storefrontUrl}
                  placeholder="https://your-store.com"
                  disabled={saving || phase === "loading"}
                  onChange={(e) => dispatch({ type: "setStorefrontUrl", value: e.target.value })}
                />
              </FormField>
              <FormField
                label="Excluded product IDs"
                hint="One Medusa product id per line or comma-separated."
              >
                <Textarea
                  value={excludedProducts}
                  rows={4}
                  disabled={saving || phase === "loading"}
                  onChange={(e) => dispatch({ type: "setExcludedProducts", value: e.target.value })}
                />
              </FormField>
              <FormField
                label="Excluded category IDs"
                hint="Products in these categories are omitted from the feed."
              >
                <Textarea
                  value={excludedCategories}
                  rows={3}
                  disabled={saving || phase === "loading"}
                  onChange={(e) => dispatch({ type: "setExcludedCategories", value: e.target.value })}
                />
              </FormField>
              {config !== null ? (
                <p className="text-xs text-content-tertiary">
                  Default condition: {config.default_condition}
                </p>
              ) : null}
              <div>
                <Button type="submit" variant="primary" disabled={saving || phase === "loading"}>
                  {saving ? "Saving…" : "Save feed settings"}
                </Button>
              </div>
            </form>
            {message !== null && phase === "ready" ? (
              <p role="alert" className="text-sm text-feedback-danger-content">
                {message}
              </p>
            ) : null}
          </Card>
        </>
      )}

      <Card>
        <h2 className="mb-4 text-lg font-semibold text-content-primary">Validation report</h2>
        <DataTable<FeedValidationIssueDto, ValidationCol>
          aria-label="Feed validation issues"
          caption="Published catalogue rows missing required Google Shopping fields"
          columns={VALIDATION_COLUMNS}
          data={sortedValidation}
          getRowId={(row) =>
            `${row.product_id}:${row.variant_id ?? "product"}:${row.missing_fields.join("-")}`
          }
          sortState={sort}
          onRequestSort={onRequestSort}
          hasRowActions={false}
          isLoading={validationPhase === "loading" || phase === "loading"}
          emptyState={
            <ListEmptyState
              title={
                validationPhase === "error"
                  ? "Validation unavailable"
                  : "No validation issues"
              }
              description={
                validationPhase === "error"
                  ? "Could not load the validation report. Check backend connection and store id."
                  : "Published products in the feed scope have the required fields."
              }
            />
          }
        />
      </Card>
    </div>
  )
}
