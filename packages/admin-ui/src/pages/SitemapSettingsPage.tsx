import { useCallback, useEffect, useState, type FormEvent } from "react"

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

export function SitemapSettingsPage(): JSX.Element {
  const [config, setConfig] = useState<SitemapConfigDto | null>(null)
  const [phase, setPhase] = useState<"loading" | "ready" | "error">("loading")
  const [message, setMessage] = useState<string | null>(null)
  const [previewXml, setPreviewXml] = useState<string | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [lastRegenerated, setLastRegenerated] = useState<string | null>(null)
  const [excludedProducts, setExcludedProducts] = useState("")
  const [excludedCategories, setExcludedCategories] = useState("")
  const [typeSettings, setTypeSettings] = useState(DEFAULTS)

  const load = useCallback(async (): Promise<void> => {
    setPhase("loading")
    setMessage(null)
    try {
      const data = await getAdminSitemapConfig()
      setConfig(data)
      setExcludedProducts(data.excluded_product_ids.join(", "))
      setExcludedCategories(data.excluded_category_ids.join(", "))
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
      setTypeSettings(next)
      setPhase("ready")
    } catch (err: unknown) {
      setPhase("error")
      setMessage(err instanceof Error ? err.message : "Failed to load sitemap config")
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const handleSave = async (event: FormEvent): Promise<void> => {
    event.preventDefault()
    setSaving(true)
    setMessage(null)
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
      setConfig(updated)
      setMessage("Sitemap configuration saved.")
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  const handlePreview = async (): Promise<void> => {
    setPreviewLoading(true)
    setMessage(null)
    try {
      const xml = await getAdminSitemapPreview()
      setPreviewXml(xml)
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : "Failed to load preview")
    } finally {
      setPreviewLoading(false)
    }
  }

  const handleRegenerate = async (): Promise<void> => {
    setRegenerating(true)
    setMessage(null)
    try {
      const result = await postAdminSitemapRegenerate()
      setLastRegenerated(result.regenerated_at)
      const xml = await getAdminSitemapPreview()
      setPreviewXml(xml)
      setMessage("Sitemap cache regenerated.")
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : "Failed to regenerate")
    } finally {
      setRegenerating(false)
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
                    setTypeSettings((prev) => ({
                      ...prev,
                      [pageType]: { ...prev[pageType], priority: e.target.value },
                    }))
                  }
                />
              </FormField>
              <FormField label="Changefreq" htmlFor={`changefreq-${pageType}`}>
                <Input
                  id={`changefreq-${pageType}`}
                  value={typeSettings[pageType].changefreq}
                  onChange={(e) =>
                    setTypeSettings((prev) => ({
                      ...prev,
                      [pageType]: { ...prev[pageType], changefreq: e.target.value },
                    }))
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
              onChange={(e) => setExcludedProducts(e.target.value)}
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
              onChange={(e) => setExcludedCategories(e.target.value)}
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
