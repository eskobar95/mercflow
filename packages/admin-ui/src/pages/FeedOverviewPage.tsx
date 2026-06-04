import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react"

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

export function FeedOverviewPage(): JSX.Element {
  const [phase, setPhase] = useState<"loading" | "ready" | "error">("loading")
  const [message, setMessage] = useState<string | null>(null)
  const [config, setConfig] = useState<FeedConfigDto | null>(null)
  const [overview, setOverview] = useState<FeedAdminOverviewDto | null>(null)
  const [storefrontUrl, setStorefrontUrl] = useState("")
  const [excludedProducts, setExcludedProducts] = useState("")
  const [excludedCategories, setExcludedCategories] = useState("")
  const [saving, setSaving] = useState(false)
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle")
  const [validationRows, setValidationRows] = useState<FeedValidationIssueDto[]>([])
  const [validationPhase, setValidationPhase] = useState<"loading" | "ready" | "error">(
    "loading"
  )
  const [sort, setSort] = useState<ListSortState<ValidationCol>>({
    column: "product",
    direction: "asc",
  })

  const reload = useCallback(async (): Promise<void> => {
    setPhase("loading")
    setMessage(null)
    try {
      const payload = await getAdminFeedConfig()
      setConfig(payload.feed_config)
      setOverview(payload.overview)
      setStorefrontUrl(payload.feed_config?.storefront_url ?? "")
      setExcludedProducts(
        formatIdLines(payload.feed_config?.excluded_product_ids ?? [])
      )
      setExcludedCategories(
        formatIdLines(payload.feed_config?.excluded_category_ids ?? [])
      )
      setPhase("ready")
    } catch (err: unknown) {
      setPhase("error")
      setMessage(err instanceof Error ? err.message : "Failed to load feed settings")
    }
  }, [])

  const reloadValidation = useCallback(async (): Promise<void> => {
    setValidationPhase("loading")
    try {
      const report = await getAdminFeedValidation()
      setValidationRows(report.validation.issues)
      setValidationPhase("ready")
    } catch {
      setValidationRows([])
      setValidationPhase("error")
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
    return [...validationRows].sort((a, b) => {
      const av = def?.getSortValue?.(a) ?? ""
      const bv = def?.getSortValue?.(b) ?? ""
      return String(av).localeCompare(String(bv)) * dir
    })
  }, [validationRows, sort])

  const onRequestSort = (columnId: ValidationCol): void => {
    setSort((prev) => {
      if (prev.column !== columnId) {
        return { column: columnId, direction: "asc" }
      }
      if (prev.direction === "asc") {
        return { column: columnId, direction: "desc" }
      }
      return { column: null, direction: "none" }
    })
  }

  const handleSave = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    setSaving(true)
    setMessage(null)
    try {
      const payload = await putAdminFeedConfig({
        storefront_url: storefrontUrl.trim() === "" ? null : storefrontUrl.trim(),
        excluded_product_ids: parseIdLines(excludedProducts),
        excluded_category_ids: parseIdLines(excludedCategories),
      })
      setConfig(payload.feed_config)
      setOverview(payload.overview)
      await reloadValidation()
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : "Failed to save feed settings")
    } finally {
      setSaving(false)
    }
  }

  const handleCopyFeedUrl = async (): Promise<void> => {
    const url = overview?.feed_url
    if (url === null || url === undefined || url === "") {
      setCopyState("failed")
      return
    }
    try {
      await navigator.clipboard.writeText(url)
      setCopyState("copied")
    } catch {
      setCopyState("failed")
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
                  onChange={(e) => setStorefrontUrl(e.target.value)}
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
                  onChange={(e) => setExcludedProducts(e.target.value)}
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
                  onChange={(e) => setExcludedCategories(e.target.value)}
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
