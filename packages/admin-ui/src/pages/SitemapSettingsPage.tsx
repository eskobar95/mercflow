import { type ReactNode, useCallback, useEffect, useReducer, type FormEvent } from "react"

import { PageHeader } from "@/components/ui/PageHeader"
import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { FormField } from "@/components/ui/FormField"
import { Input } from "@/components/ui/Input"
import {
  getAdminSitemapConfig,
  getAdminSitemapPreview,
  postAdminSitemapRegenerate,
  putAdminSitemapConfig,
} from "@/features/seo/sitemapApi"
import type { SitemapConfigDto, SitemapPageType } from "@/features/seo/types"

const PAGE_TYPES: SitemapPageType[] = ["product", "category", "page"]

const DEFAULTS: Record<SitemapPageType, { priority: string; changefreq: string }> = {
  product: { priority: "0.8", changefreq: "weekly" },
  category: { priority: "0.6", changefreq: "weekly" },
  page: { priority: "0.5", changefreq: "monthly" },
}

type SitemapTypeSettings = Record<SitemapPageType, { priority: string; changefreq: string }>

type SitemapSettingsState = {
  config: SitemapConfigDto | null
  phase: "loading" | "ready" | "error"
  message: string | null
  previewXml: string | null
  previewLoading: boolean
  saving: boolean
  regenerating: boolean
  lastRegenerated: string | null
  excludedProducts: string
  excludedCategories: string
  typeSettings: SitemapTypeSettings
}

type SitemapSettingsAction =
  | { type: "loadStart" }
  | { type: "loadSuccess"; payload: Pick<SitemapSettingsState, "config" | "excludedProducts" | "excludedCategories" | "typeSettings"> }
  | { type: "loadError"; message: string }
  | { type: "setMessage"; message: string | null }
  | { type: "setExcludedProducts"; value: string }
  | { type: "setExcludedCategories"; value: string }
  | { type: "updateTypeSetting"; pageType: SitemapPageType; patch: Partial<{ priority: string; changefreq: string }> }
  | { type: "saveStart" }
  | { type: "saveFinish" }
  | { type: "saveSuccess"; config: SitemapConfigDto; message: string }
  | { type: "previewStart" }
  | { type: "previewFinish" }
  | { type: "previewSuccess"; xml: string }
  | { type: "regenerateStart" }
  | { type: "regenerateFinish" }
  | { type: "regenerateSuccess"; regeneratedAt: string; xml: string; message: string }

const INITIAL_SITEMAP_SETTINGS_STATE: SitemapSettingsState = {
  config: null,
  phase: "loading",
  message: null,
  previewXml: null,
  previewLoading: false,
  saving: false,
  regenerating: false,
  lastRegenerated: null,
  excludedProducts: "",
  excludedCategories: "",
  typeSettings: DEFAULTS,
}

function sitemapSettingsReducer(
  state: SitemapSettingsState,
  action: SitemapSettingsAction,
): SitemapSettingsState {
  switch (action.type) {
    case "loadStart":
      return { ...state, phase: "loading", message: null }
    case "loadSuccess":
      return { ...state, ...action.payload, phase: "ready" }
    case "loadError":
      return { ...state, phase: "error", message: action.message }
    case "setMessage":
      return { ...state, message: action.message }
    case "setExcludedProducts":
      return { ...state, excludedProducts: action.value }
    case "setExcludedCategories":
      return { ...state, excludedCategories: action.value }
    case "updateTypeSetting":
      return {
        ...state,
        typeSettings: {
          ...state.typeSettings,
          [action.pageType]: { ...state.typeSettings[action.pageType], ...action.patch },
        },
      }
    case "saveStart":
      return { ...state, saving: true, message: null }
    case "saveFinish":
      return { ...state, saving: false }
    case "saveSuccess":
      return { ...state, config: action.config, message: action.message }
    case "previewStart":
      return { ...state, previewLoading: true, message: null }
    case "previewFinish":
      return { ...state, previewLoading: false }
    case "previewSuccess":
      return { ...state, previewXml: action.xml }
    case "regenerateStart":
      return { ...state, regenerating: true, message: null }
    case "regenerateFinish":
      return { ...state, regenerating: false }
    case "regenerateSuccess":
      return {
        ...state,
        lastRegenerated: action.regeneratedAt,
        previewXml: action.xml,
        message: action.message,
      }
    default:
      return state
  }
}

export function SitemapSettingsPage(): ReactNode {
  const [state, dispatch] = useReducer(sitemapSettingsReducer, INITIAL_SITEMAP_SETTINGS_STATE)
  const {
    config,
    phase,
    message,
    previewXml,
    previewLoading,
    saving,
    regenerating,
    lastRegenerated,
    excludedProducts,
    excludedCategories,
    typeSettings,
  } = state

  const load = useCallback(async (): Promise<void> => {
    dispatch({ type: "loadStart" })
    try {
      const data = await getAdminSitemapConfig()
      const next = { ...DEFAULTS }
      for (const pageType of PAGE_TYPES) {
        const row = data.page_type_settings[pageType]
        if (row) {
          next[pageType] = {
            priority: String(row.priority),
            changefreq: row.changefreq,
          }
        }
      }
      dispatch({
        type: "loadSuccess",
        payload: {
          config: data,
          excludedProducts: data.excluded_product_ids.join(", "),
          excludedCategories: data.excluded_category_ids.join(", "),
          typeSettings: next,
        },
      })
    } catch (err: unknown) {
      dispatch({
        type: "loadError",
        message: err instanceof Error ? err.message : "Failed to load sitemap config",
      })
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const handleSave = async (event: FormEvent): Promise<void> => {
    event.preventDefault()
    dispatch({ type: "saveStart" })
    try {
      const page_type_settings = Object.fromEntries(
        PAGE_TYPES.map((pageType) => [
          pageType,
          {
            priority: Number.parseFloat(typeSettings[pageType].priority),
            changefreq: typeSettings[pageType].changefreq.trim(),
          },
        ])
      ) as SitemapConfigDto["page_type_settings"]
      const updated = await putAdminSitemapConfig({
        page_type_settings,
        excluded_product_ids: excludedProducts
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s.length > 0),
        excluded_category_ids: excludedCategories
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s.length > 0),
      })
      dispatch({ type: "saveSuccess", config: updated, message: "Sitemap configuration saved." })
    } catch (err: unknown) {
      dispatch({
        type: "setMessage",
        message: err instanceof Error ? err.message : "Failed to save",
      })
    } finally {
      dispatch({ type: "saveFinish" })
    }
  }

  const handlePreview = async (): Promise<void> => {
    dispatch({ type: "previewStart" })
    try {
      const xml = await getAdminSitemapPreview()
      dispatch({ type: "previewSuccess", xml })
    } catch (err: unknown) {
      dispatch({
        type: "setMessage",
        message: err instanceof Error ? err.message : "Failed to load preview",
      })
    } finally {
      dispatch({ type: "previewFinish" })
    }
  }

  const handleRegenerate = async (): Promise<void> => {
    dispatch({ type: "regenerateStart" })
    try {
      const result = await postAdminSitemapRegenerate()
      const xml = await getAdminSitemapPreview()
      dispatch({
        type: "regenerateSuccess",
        regeneratedAt: result.regenerated_at,
        xml,
        message: "Sitemap cache regenerated.",
      })
    } catch (err: unknown) {
      dispatch({
        type: "setMessage",
        message: err instanceof Error ? err.message : "Failed to regenerate",
      })
    } finally {
      dispatch({ type: "regenerateFinish" })
    }
  }

  if (phase === "loading") {
    return (
      <div className="space-y-6">
        <PageHeader title="SEO — Sitemap" description="Configure sitemap priorities and exclusions." />
        <p className="text-content-secondary">Loading…</p>
      </div>
    )
  }

  if (phase === "error") {
    return (
      <div className="space-y-6">
        <PageHeader title="SEO — Sitemap" description="Configure sitemap priorities and exclusions." />
        <p className="text-content-danger" role="alert">
          {message}
        </p>
        <Button type="button" onClick={() => void load()}>
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="SEO — Sitemap"
        description="Priority and changefreq per page type, exclusions, preview, and manual regeneration."
      />
      {message ? (
        <p className="text-content-secondary" role="status">
          {message}
        </p>
      ) : null}
      <form className="space-y-6" onSubmit={(e) => void handleSave(e)}>
        <Card className="space-y-4 p-6">
          <h2 className="text-heading-sm text-content-primary">Page type defaults</h2>
          {PAGE_TYPES.map((pageType) => (
            <div key={pageType} className="grid gap-4 sm:grid-cols-3">
              <p className="text-body-sm font-medium capitalize text-content-primary">{pageType}</p>
              <FormField label="Priority" htmlFor={`priority-${pageType}`}>
                <Input
                  id={`priority-${pageType}`}
                  value={typeSettings[pageType].priority}
                  onChange={(e) =>
                    dispatch({
                      type: "updateTypeSetting",
                      pageType,
                      patch: { priority: e.target.value },
                    })
                  }
                />
              </FormField>
              <FormField label="Changefreq" htmlFor={`changefreq-${pageType}`}>
                <Input
                  id={`changefreq-${pageType}`}
                  value={typeSettings[pageType].changefreq}
                  onChange={(e) =>
                    dispatch({
                      type: "updateTypeSetting",
                      pageType,
                      patch: { changefreq: e.target.value },
                    })
                  }
                />
              </FormField>
            </div>
          ))}
        </Card>
        <Card className="space-y-4 p-6">
          <h2 className="text-heading-sm text-content-primary">Exclusions</h2>
          <FormField
            label="Excluded product IDs"
            htmlFor="excluded-products"
            hint="Comma-separated Medusa product IDs"
          >
            <Input
              id="excluded-products"
              value={excludedProducts}
              onChange={(e) => dispatch({ type: "setExcludedProducts", value: e.target.value })}
            />
          </FormField>
          <FormField
            label="Excluded category IDs"
            htmlFor="excluded-categories"
            hint="Comma-separated Medusa category IDs"
          >
            <Input
              id="excluded-categories"
              value={excludedCategories}
              onChange={(e) => dispatch({ type: "setExcludedCategories", value: e.target.value })}
            />
          </FormField>
        </Card>
        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save configuration"}
          </Button>
          <Button type="button" variant="secondary" disabled={previewLoading} onClick={() => void handlePreview()}>
            {previewLoading ? "Loading preview…" : "Preview XML"}
          </Button>
          <Button type="button" variant="secondary" disabled={regenerating} onClick={() => void handleRegenerate()}>
            {regenerating ? "Regenerating…" : "Regenerate public sitemap"}
          </Button>
        </div>
      </form>
      {lastRegenerated ? (
        <p className="text-body-sm text-content-secondary">Last regenerated: {lastRegenerated}</p>
      ) : null}
      {previewXml ? (
        <Card className="p-6">
          <h2 className="mb-3 text-heading-sm text-content-primary">XML preview</h2>
          <pre className="max-h-96 overflow-auto whitespace-pre-wrap break-all rounded-md border border-border-default bg-surface-subtle p-4 text-body-sm text-content-primary">
            {previewXml}
          </pre>
        </Card>
      ) : null}
      {config ? (
        <p className="text-body-sm text-content-secondary">Config id: {config.id}</p>
      ) : null}
    </div>
  )
}
