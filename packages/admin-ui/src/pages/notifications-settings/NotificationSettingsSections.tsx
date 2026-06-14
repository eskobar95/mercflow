import { type FormEvent, type ReactNode } from "react"

import { EmailPreviewModal } from "@/components/notifications/EmailPreviewModal"
import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { FormField } from "@/components/ui/FormField"
import { Input } from "@/components/ui/Input"
import { Switch } from "@/components/ui/Switch"
import { isTemplateEnabled } from "@/features/notifications/notificationTemplates"

import type { useNotificationsSettingsPage } from "./useNotificationsSettingsPage"

type Controller = ReturnType<typeof useNotificationsSettingsPage>

export function NotificationBrandingSection({ controller }: { controller: Controller }): ReactNode {
  const { state, setField, handleSaveBranding } = controller
  const { values, fieldErrors, savingBranding, brandingSaveMessage, brandingSaveErrorMessage } = state

  return (
    <Card className="space-y-5 p-6">
      <div>
        <h2 className="text-lg font-semibold text-content-primary">Branding</h2>
        <p className="mt-1 text-sm text-content-secondary">
          Logo, colors, and sender details applied to all transactional emails.
        </p>
      </div>

      <form
        className="space-y-5"
        noValidate
        onSubmit={(event: FormEvent<HTMLFormElement>) => {
          event.preventDefault()
          void handleSaveBranding()
        }}
      >
        {brandingSaveMessage ? (
          <output className="block text-sm text-content-secondary">{brandingSaveMessage}</output>
        ) : null}
        {brandingSaveErrorMessage ? (
          <div role="alert" className="text-sm text-content-danger">
            {brandingSaveErrorMessage}
          </div>
        ) : null}

        <FormField label="From name" htmlFor="notification-from-name" required error={fieldErrors.storeName}>
          <Input
            id="notification-from-name"
            value={values.storeName}
            error={fieldErrors.storeName !== undefined}
            onChange={(event) => setField("storeName", event.target.value)}
          />
        </FormField>

        <FormField label="Reply-to email" htmlFor="notification-reply-to" error={fieldErrors.replyTo}>
          <Input
            id="notification-reply-to"
            type="email"
            value={values.replyTo}
            error={fieldErrors.replyTo !== undefined}
            onChange={(event) => setField("replyTo", event.target.value)}
          />
        </FormField>

        <FormField label="Logo URL" htmlFor="notification-logo-url" error={fieldErrors.logoUrl}>
          <Input
            id="notification-logo-url"
            type="url"
            value={values.logoUrl}
            error={fieldErrors.logoUrl !== undefined}
            onChange={(event) => setField("logoUrl", event.target.value)}
          />
        </FormField>

        <div className="grid gap-4 sm:grid-cols-[120px_minmax(0,1fr)]">
          <FormField label="Brand color" htmlFor="notification-brand-color">
            <Input
              id="notification-brand-color"
              type="color"
              value={values.brandColor}
              className="h-11 px-2 py-1"
              onChange={(event) => setField("brandColor", event.target.value)}
            />
          </FormField>
          <FormField label="Hex" htmlFor="notification-brand-hex" error={fieldErrors.brandColor}>
            <Input
              id="notification-brand-hex"
              value={values.brandColor}
              error={fieldErrors.brandColor !== undefined}
              onChange={(event) => setField("brandColor", event.target.value)}
            />
          </FormField>
        </div>

        <Button type="submit" variant="primary" disabled={savingBranding}>
          {savingBranding ? "Saving…" : "Save branding"}
        </Button>
      </form>
    </Card>
  )
}

export function NotificationTemplatesSection({ controller }: { controller: Controller }): ReactNode {
  const {
    state,
    setTemplateEnabled,
    handleSaveTemplates,
    openPreviewModal,
    closePreviewModal,
    retryPreview,
    previewTitle,
  } = controller
  const {
    templates,
    disabledTemplates,
    savingTemplates,
    templatesSaveMessage,
    templatesSaveErrorMessage,
    preview,
  } = state

  return (
    <Card className="space-y-5 p-6">
      <div>
        <h2 className="text-lg font-semibold text-content-primary">Templates</h2>
        <p className="mt-1 text-sm text-content-secondary">
          Enable or disable individual notification types. Preview uses your saved branding.
        </p>
      </div>

      <ul className="divide-y divide-border-subtle">
        {templates.map((template) => {
          const enabled = isTemplateEnabled(template.key, disabledTemplates)
          const inputId = `notification-template-${template.key}`

          return (
            <li
              key={template.key}
              className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <label htmlFor={inputId} className="text-sm font-medium text-content-primary">
                  {template.label}
                </label>
                <p className="mt-1 text-sm text-content-secondary">{template.description}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Switch
                  id={inputId}
                  checked={enabled}
                  onCheckedChange={(checked) => setTemplateEnabled(template.key, checked)}
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => openPreviewModal(template.key)}
                >
                  Preview
                </Button>
              </div>
            </li>
          )
        })}
      </ul>

      {templatesSaveMessage ? (
        <output className="block text-sm text-content-secondary">{templatesSaveMessage}</output>
      ) : null}
      {templatesSaveErrorMessage ? (
        <div role="alert" className="text-sm text-content-danger">
          {templatesSaveErrorMessage}
        </div>
      ) : null}

      <Button
        type="button"
        variant="primary"
        disabled={savingTemplates}
        onClick={() => {
          void handleSaveTemplates()
        }}
      >
        {savingTemplates ? "Saving…" : "Save templates"}
      </Button>

      <EmailPreviewModal
        open={preview.modalOpen}
        onOpenChange={(open) => {
          if (!open) {
            closePreviewModal()
          }
        }}
        title={previewTitle}
        html={preview.html}
        loading={preview.loading}
        error={preview.error}
        onRetry={retryPreview}
      />
    </Card>
  )
}
