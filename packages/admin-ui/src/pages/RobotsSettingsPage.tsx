import { type ReactNode, useCallback, useEffect, useReducer, type FormEvent } from "react"

import { PageHeader } from "@/components/ui/PageHeader"
import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { Checkbox } from "@/components/ui/Checkbox"
import { FormField } from "@/components/ui/FormField"
import { Input } from "@/components/ui/Input"
import { Textarea } from "@/components/ui/Textarea"
import { getAdminRobotsConfig, putAdminRobotsConfig } from "@/features/seo/robotsApi"
import type { RobotsConfigDto, RobotsRuleDto } from "@/features/seo/types"

function defaultRule(): RobotsRuleRow {
  return { clientId: crypto.randomUUID(), user_agent: "*", allow: ["/"], disallow: [] }
}

type RobotsRuleRow = RobotsRuleDto & { clientId: string }

function toRuleRows(rules: RobotsRuleDto[]): RobotsRuleRow[] {
  return rules.map((rule) => ({ ...rule, clientId: crypto.randomUUID() }))
}

function stripRuleIds(rules: RobotsRuleRow[]): RobotsRuleDto[] {
  return rules.map(({ user_agent, allow, disallow }) => ({
    user_agent,
    allow,
    disallow,
  }))
}

type RobotsSettingsState = {
  config: RobotsConfigDto | null
  preview: string
  phase: "loading" | "ready" | "error"
  message: string | null
  freetextMode: boolean
  freetext: string
  rules: RobotsRuleRow[]
  saving: boolean
}

type RobotsSettingsAction =
  | { type: "loadStart" }
  | { type: "loadSuccess"; payload: Pick<RobotsSettingsState, "config" | "preview" | "freetextMode" | "freetext" | "rules"> }
  | { type: "loadError"; message: string }
  | { type: "setMessage"; message: string | null }
  | { type: "setFreetextMode"; value: boolean }
  | { type: "setFreetext"; value: string }
  | { type: "updateRule"; index: number; patch: Partial<RobotsRuleDto> }
  | { type: "saveStart" }
  | { type: "saveFinish" }
  | { type: "saveSuccess"; config: RobotsConfigDto; preview: string; message: string }

const INITIAL_ROBOTS_SETTINGS_STATE: RobotsSettingsState = {
  config: null,
  preview: "",
  phase: "loading",
  message: null,
  freetextMode: false,
  freetext: "",
  rules: [defaultRule()],
  saving: false,
}

function robotsSettingsReducer(
  state: RobotsSettingsState,
  action: RobotsSettingsAction,
): RobotsSettingsState {
  switch (action.type) {
    case "loadStart":
      return { ...state, phase: "loading", message: null }
    case "loadSuccess":
      return { ...state, ...action.payload, phase: "ready" }
    case "loadError":
      return { ...state, phase: "error", message: action.message }
    case "setMessage":
      return { ...state, message: action.message }
    case "setFreetextMode":
      return { ...state, freetextMode: action.value }
    case "setFreetext":
      return { ...state, freetext: action.value }
    case "updateRule":
      return {
        ...state,
        rules: state.rules.map((rule, i) =>
          i === action.index ? { ...rule, ...action.patch } : rule
        ),
      }
    case "saveStart":
      return { ...state, saving: true, message: null }
    case "saveFinish":
      return { ...state, saving: false }
    case "saveSuccess":
      return {
        ...state,
        config: action.config,
        preview: action.preview,
        message: action.message,
      }
    default:
      return state
  }
}

export function RobotsSettingsPage(): ReactNode {
  const [state, dispatch] = useReducer(robotsSettingsReducer, INITIAL_ROBOTS_SETTINGS_STATE)
  const { config, preview, phase, message, freetextMode, freetext, rules, saving } = state

  const load = useCallback(async (): Promise<void> => {
    dispatch({ type: "loadStart" })
    try {
      const data = await getAdminRobotsConfig()
      const hasFreetext =
        data.config.freetext_override !== null && data.config.freetext_override.trim().length > 0
      dispatch({
        type: "loadSuccess",
        payload: {
          config: data.config,
          preview: data.preview,
          freetextMode: hasFreetext,
          freetext: data.config.freetext_override ?? "",
          rules:
            data.config.structured_rules.rules.length > 0
              ? toRuleRows(data.config.structured_rules.rules)
              : [defaultRule()],
        },
      })
    } catch (err: unknown) {
      dispatch({
        type: "loadError",
        message: err instanceof Error ? err.message : "Failed to load robots config",
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
      const payload = freetextMode
        ? {
            freetext_override: freetext.trim() === "" ? null : freetext,
            change_summary: "Updated robots.txt (freetext)",
          }
        : {
            structured_rules: { rules: stripRuleIds(rules) },
            freetext_override: null,
            change_summary: "Updated robots.txt (structured)",
          }
      const result = await putAdminRobotsConfig(payload)
      dispatch({
        type: "saveSuccess",
        config: result.config,
        preview: result.preview,
        message: "Robots configuration saved.",
      })
    } catch (err: unknown) {
      dispatch({
        type: "setMessage",
        message: err instanceof Error ? err.message : "Failed to save",
      })
    } finally {
      dispatch({ type: "saveFinish" })
    }
  }

  const updateRule = (index: number, patch: Partial<RobotsRuleDto>): void => {
    dispatch({ type: "updateRule", index, patch })
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
          <Checkbox
            id="robots-freetext-mode"
            checked={freetextMode}
            onCheckedChange={(checked) =>
              dispatch({ type: "setFreetextMode", value: checked === true })
            }
            label="Use freetext mode"
          />
          {freetextMode ? (
            <FormField label="robots.txt body" htmlFor="robots-freetext">
              <Textarea
                id="robots-freetext"
                className="min-h-40"
                value={freetext}
                onChange={(e) => dispatch({ type: "setFreetext", value: e.target.value })}
              />
            </FormField>
          ) : (
            <div className="space-y-4">
              {rules.map((rule, index) => (
                <div key={rule.clientId} className="space-y-3 rounded-md border border-border-default p-4">
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
