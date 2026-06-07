import type { Dispatch, ReactNode } from "react"

import { Card } from "@/components/ui/Card"
import { FormField } from "@/components/ui/FormField"
import { Input } from "@/components/ui/Input"
import { Textarea } from "@/components/ui/Textarea"

import type { ProductContentFormAction } from "./productContentFormState"
import { SEO_DESCRIPTION_MAX, SEO_TITLE_MAX } from "./productContentFormState"
import { SEOPreview } from "./SEOPreview"
import { SocialSharePreview } from "./SocialSharePreview"

type ProductContentSeoSectionProps = {
  formId: string
  seoTitle: string
  seoDescription: string
  ogUrl: string
  canonicalUrl: string
  seoTitleTooLong: boolean
  seoDescriptionTooLong: boolean
  disabled: boolean
  seoPreviewTitle: string
  productTitleFallback: string
  dispatchForm: Dispatch<ProductContentFormAction>
}

export function ProductContentSeoSection({
  formId,
  seoTitle,
  seoDescription,
  ogUrl,
  canonicalUrl,
  seoTitleTooLong,
  seoDescriptionTooLong,
  disabled,
  seoPreviewTitle,
  productTitleFallback,
  dispatchForm,
}: ProductContentSeoSectionProps): ReactNode {
  return (
    <Card className="space-y-4">
      <h2 className="text-lg font-semibold text-content-primary">SEO</h2>
      <p className="mt-1 text-sm text-content-secondary">
        Meta limits follow MercFlow CMS rules (title 255 chars, snippet 160).
      </p>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <FormField
            label="Meta title"
            htmlFor={`${formId}-seo-title`}
            hint={
              seoTitleTooLong
                ? undefined
                : `${seoTitle.length} / ${SEO_TITLE_MAX} characters`
            }
            error={
              seoTitleTooLong
                ? `${seoTitle.length} / ${SEO_TITLE_MAX} characters — shorten before saving.`
                : undefined
            }
          >
            <Input
              id={`${formId}-seo-title`}
              type="text"
              value={seoTitle}
              onChange={(e) => {
                dispatchForm({ type: "setSeoTitle", value: e.target.value })
              }}
              disabled={disabled}
              autoComplete="off"
              error={seoTitleTooLong}
            />
          </FormField>
          <FormField
            label="Meta description"
            htmlFor={`${formId}-seo-desc`}
            hint={
              seoDescriptionTooLong
                ? undefined
                : `${seoDescription.length} / ${SEO_DESCRIPTION_MAX} characters`
            }
            error={
              seoDescriptionTooLong
                ? `${seoDescription.length} / ${SEO_DESCRIPTION_MAX} characters — shorten before saving.`
                : undefined
            }
          >
            <Textarea
              id={`${formId}-seo-desc`}
              value={seoDescription}
              onChange={(e): void => {
                dispatchForm({ type: "setSeoDescription", value: e.target.value })
              }}
              onBlur={(): void => {
                if (seoDescription.length > SEO_DESCRIPTION_MAX) {
                  dispatchForm({
                    type: "setValidationError",
                    value: `SEO description must be at most ${SEO_DESCRIPTION_MAX} characters (currently ${seoDescription.length}).`,
                  })
                }
              }}
              disabled={disabled}
              rows={4}
              error={seoDescriptionTooLong}
            />
          </FormField>
          <FormField
            label="Open Graph image URL"
            htmlFor={`${formId}-og-url`}
            hint="Sent as seo_og_image_id in mutations and stored on the OG URL column."
          >
            <Input
              id={`${formId}-og-url`}
              type="url"
              placeholder="https://"
              value={ogUrl}
              onChange={(e) => {
                dispatchForm({ type: "setOgUrl", value: e.target.value })
              }}
              disabled={disabled}
              autoComplete="off"
            />
          </FormField>
          <FormField
            label="Canonical URL override"
            htmlFor={`${formId}-canonical`}
            hint="When set, storefront canonical APIs return this URL. A host mismatch vs the auto URL surfaces a warning in the store response."
          >
            <Input
              id={`${formId}-canonical`}
              type="url"
              placeholder="Leave empty for auto-calculated canonical"
              value={canonicalUrl}
              onChange={(e) => {
                dispatchForm({ type: "setCanonicalUrl", value: e.target.value })
              }}
              disabled={disabled}
              autoComplete="off"
            />
          </FormField>
        </div>
        <div className="space-y-4">
          <SEOPreview
            title={seoPreviewTitle}
            description={seoDescription}
            fallbackTitle={productTitleFallback}
          />
          <SocialSharePreview
            title={seoPreviewTitle}
            description={seoDescription}
            imageUrl={ogUrl.trim() !== "" ? ogUrl.trim() : null}
            fallbackTitle={productTitleFallback}
          />
        </div>
      </div>
    </Card>
  )
}
