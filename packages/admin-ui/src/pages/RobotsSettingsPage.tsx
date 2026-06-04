import { useCallback, useEffect, useState, type FormEvent } from "react"

import { PageHeader } from "@/components/ui/PageHeader"
import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { FormField } from "@/components/ui/FormField"
import { Input } from "@/components/ui/Input"
import { getAdminRobotsConfig, putAdminRobotsConfig } from "@/features/seo/robotsApi"
import type { RobotsConfigDto, RobotsRuleDto } from "@/features/seo/types"

function defaultRule(): RobotsRuleDto {
  return { user_agent: "*", allow: ["/"], disallow: [] }
}

export function RobotsSettingsPage(): JSX.Element {
  const [config, setConfig] = useState<RobotsConfigDto | null>(null)
  const [preview, setPreview] = useState<string>("")
  const [phase, setPhase] = useState<"loading" | "ready" | "error">("loading")
  const [message, setMessage] = useState<string | null>(null)
  const [freetextMode, setFreetextMode] = useState(false)
  const [freetext, setFreetext] = useState("")
  const [rules, setRules] = useState<RobotsRuleDto[]>([defaultRule()])
  const [saving, setSaving] = useState(false)

  const load = useCallback(async (): Promise<void> => {
    setPhase("loading")
    setMessage(null)
    try {
      const data = await getAdminRobotsConfig()
      setConfig(data.config)
      setPreview(data.preview)
      const hasFreetext =
        data.config.freetext_override !== null && data.config.freetext_override.trim().length > 0
      setFreetextMode(hasFreetext)
      setFreetext(data.config.freetext_override ?? "")
      setRules(
        data.config.structured_rules.rules.length > 0
          ? data.config.structured_rules.rules
          : [defaultRule()]
      )
      setPhase("ready")
    } catch (err: unknown) {
      setPhase("error")
      setMessage(err instanceof Error ? err.message : "Failed to load robots config")
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
      const payload = freetextMode
        ? {
            freetext_override: freetext.trim() === "" ? null : freetext,
            change_summary: "Updated robots.txt (freetext)",
          }
        : {
            structured_rules: { rules },
            freetext_override: null,
            change_summary: "Updated robots.txt (structured)",
          }
      const result = await putAdminRobotsConfig(payload)
      setConfig(result.config)
      setPreview(result.preview)
      setMessage("Robots configuration saved.")
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  const updateRule = (index: number, patch: Partial<RobotsRuleDto>): void => {
    setRules((prev) =>
      prev.map((rule, i) => (i === index ? { ...rule, ...patch } : rule))
    )
  }

  if (phase === "loading") {
    return (
      <div className="space-y-6">
        <PageHeader title="SEO — Robots.txt" description="Manage crawl rules for search engines." />
        <p className="text-content-secondary">Loading…</p>
      </div>
    )
  }

  if (phase === "error") {
    return (
      <div className="space-y-6">
        <PageHeader title="SEO — Robots.txt" description="Manage crawl rules for search engines." />
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
        title="SEO — Robots.txt"
        description="Structured allow/block rules or freetext override. Sitemap line is added automatically."
      />
      {message ? (
        <p className="text-content-secondary" role="status">
          {message}
        </p>
      ) : null}
      <form className="space-y-6" onSubmit={(e) => void handleSave(e)}>
        <Card className="space-y-4 p-6">
          <label className="flex items-center gap-2 text-body-sm text-content-primary">
            <input
              type="checkbox"
              checked={freetextMode}
              onChange={(e) => setFreetextMode(e.target.checked)}
            />
            Use freetext mode
          </label>
          {freetextMode ? (
            <FormField label="robots.txt body" htmlFor="robots-freetext">
              <textarea
                id="robots-freetext"
                className="min-h-40 w-full rounded-md border border-border-default bg-surface-default px-3 py-2 text-body-sm text-content-primary"
                value={freetext}
                onChange={(e) => setFreetext(e.target.value)}
              />
            </FormField>
          ) : (
            <div className="space-y-4">
              {rules.map((rule, index) => (
                <div key={index} className="space-y-3 rounded-md border border-border-default p-4">
                  <FormField label="User-agent" htmlFor={`ua-${index}`}>
                    <Input
                      id={`ua-${index}`}
                      value={rule.user_agent}
                      onChange={(e) => updateRule(index, { user_agent: e.target.value })}
                    />
                  </FormField>
                  <FormField label="Allow paths (comma-separated)" htmlFor={`allow-${index}`}>
                    <Input
                      id={`allow-${index}`}
                      value={rule.allow.join(", ")}
                      onChange={(e) =>
                        updateRule(index, {
                          allow: e.target.value
                            .split(",")
                            .map((s) => s.trim())
                            .filter((s) => s.length > 0),
                        })
                      }
                    />
                  </FormField>
                  <FormField label="Disallow paths (comma-separated)" htmlFor={`disallow-${index}`}>
                    <Input
                      id={`disallow-${index}`}
                      value={rule.disallow.join(", ")}
                      onChange={(e) =>
                        updateRule(index, {
                          disallow: e.target.value
                            .split(",")
                            .map((s) => s.trim())
                            .filter((s) => s.length > 0),
                        })
                      }
                    />
                  </FormField>
                </div>
              ))}
            </div>
          )}
        </Card>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save robots.txt"}
        </Button>
      </form>
      <Card className="p-6">
        <h2 className="mb-3 text-heading-sm text-content-primary">Preview</h2>
        <pre className="whitespace-pre-wrap rounded-md border border-border-default bg-surface-subtle p-4 text-body-sm text-content-primary">
          {preview}
        </pre>
      </Card>
      {config && config.change_history.length > 0 ? (
        <Card className="p-6">
          <h2 className="mb-3 text-heading-sm text-content-primary">Change history</h2>
          <ul className="space-y-2 text-body-sm text-content-secondary">
            {config.change_history.map((entry) => (
              <li key={entry.changed_at}>
                <span className="text-content-primary">{entry.changed_at}</span> — {entry.summary}
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </div>
  )
}
