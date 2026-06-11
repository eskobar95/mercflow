import { type FormEvent, type ReactNode } from "react"

import { EmailPreviewModal } from "@/components/notifications/EmailPreviewModal"
import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { FormField } from "@/components/ui/FormField"
import { Input } from "@/components/ui/Input"
import { Spinner } from "@/components/ui/Spinner"

import { useEmailBrandingTab } from "./useEmailBrandingTab"

export function EmailBrandingTab(): ReactNode {
  const { state, setField, reload, handleSave, openPreviewModal, closePreviewModal, refreshPreview } =
    useEmailBrandingTab()
  const {
    phase,
    message,
    values,
    fieldErrors,
    saving,
    saveMessage,
    saveErrorMessage,
    previewHtml,
    previewLoading,
    previewError,
    previewModalOpen,
  } = state

  if (phase === "loading") return <Spinner label="Loading email branding settings" />
  if (phase === "error") {
    return (
      <div role="alert" className="rounded-lg border border-interactive-danger-subtle p-4">
        <p className="text-sm text-content-danger">{message}</p>
        <Button type="button" variant="secondary" className="mt-4" onClick={() => void reload()}>
          Retry
        </Button>
      </div>
    )
  }

  return (
    <>
      <form
        className="space-y-6"
        onSubmit={(event: FormEvent<HTMLFormElement>) => {
          event.preventDefault()
          void handleSave()
        }}
        noValidate
      >
        {saveMessage ? <output className="block text-sm text-content-secondary">{saveMessage}</output> : null}
        {saveErrorMessage ? (
          <div role="alert" className="text-sm text-content-danger">
            {saveErrorMessage}
          </div>
        ) : null}
        <Card className="space-y-5 p-6">
          <FormField label="Logo URL" htmlFor="email-branding-logo-url" hint="Absolute HTTPS URL." error={fieldErrors.logoUrl}>
            <Input id="email-branding-logo-url" type="url" value={values.logoUrl} error={fieldErrors.logoUrl !== undefined} onChange={(e) => setField("logoUrl", e.target.value)} />
          </FormField>
          <FormField label="Store display name" htmlFor="email-branding-store-name" required error={fieldErrors.storeName}>
            <Input id="email-branding-store-name" value={values.storeName} error={fieldErrors.storeName !== undefined} onChange={(e) => setField("storeName", e.target.value)} />
          </FormField>
          <div className="grid gap-4 sm:grid-cols-[120px_minmax(0,1fr)]">
            <FormField label="Brand color" htmlFor="email-branding-color-picker" error={fieldErrors.brandColor}>
              <Input id="email-branding-color-picker" type="color" value={values.brandColor} className="h-11 px-2 py-1" onChange={(e) => setField("brandColor", e.target.value)} />
            </FormField>
            <FormField label="Hex value" htmlFor="email-branding-color-hex" error={fieldErrors.brandColor}>
              <Input id="email-branding-color-hex" value={values.brandColor} error={fieldErrors.brandColor !== undefined} onChange={(e) => setField("brandColor", e.target.value)} />
            </FormField>
          </div>
          <FormField label="Reply-to email" htmlFor="email-branding-reply-to" error={fieldErrors.replyTo}>
            <Input id="email-branding-reply-to" type="email" value={values.replyTo} error={fieldErrors.replyTo !== undefined} onChange={(e) => setField("replyTo", e.target.value)} />
          </FormField>
          <FormField label="Support email" htmlFor="email-branding-support-email" error={fieldErrors.supportEmail}>
            <Input id="email-branding-support-email" type="email" value={values.supportEmail} error={fieldErrors.supportEmail !== undefined} onChange={(e) => setField("supportEmail", e.target.value)} />
          </FormField>
        </Card>
        <div className="flex flex-wrap gap-3">
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? "Saving…" : "Save branding"}
          </Button>
          <Button type="button" variant="secondary" disabled={previewLoading} onClick={openPreviewModal}>
            {previewLoading ? "Refreshing preview…" : "Preview"}
          </Button>
        </div>
      </form>
      <EmailPreviewModal
        open={previewModalOpen}
        onOpenChange={(open: boolean) => {
          if (!open) closePreviewModal()
        }}
        html={previewHtml}
        loading={previewLoading}
        error={previewError}
        onRetry={() => void refreshPreview()}
      />
    </>
  )
}
