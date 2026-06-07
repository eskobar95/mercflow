import type { Dispatch, ReactNode } from "react"

import { Card } from "@/components/ui/Card"
import { FormField } from "@/components/ui/FormField"
import { Input } from "@/components/ui/Input"
import { Textarea } from "@/components/ui/Textarea"

import { SEOPreview } from "../product-content/SEOPreview"

import type { CategoryContentFormAction } from "./categoryContentFormState"
import { SEO_DESCRIPTION_MAX, SEO_TITLE_MAX } from "./categoryContentFormState"

type CategoryContentSeoSectionProps = {
  formId: string
  seoTitle: string
  seoDescription: string
  seoTitleTooLong: boolean
  seoDescriptionTooLong: boolean
  disabled: boolean
  seoPreviewTitle: string
  categoryTitleFallback: string
  dispatchForm: Dispatch<CategoryContentFormAction>
}

export function CategoryContentSeoSection({
  formId,
  seoTitle,
  seoDescription,
  seoTitleTooLong,
  seoDescriptionTooLong,
  disabled,
  seoPreviewTitle,
  categoryTitleFallback,
  dispatchForm,
}: CategoryContentSeoSectionProps): ReactNode {
  return (
    <Card className="space-y-4">
      <h2 className="text-lg font-semibold text-content-primary">SEO</h2>
      <p className="mt-1 text-sm text-content-secondary">
        Meta limits follow MercFlow CMS rules (title {SEO_TITLE_MAX} chars, snippet{" "}
        {SEO_DESCRIPTION_MAX}).
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
        </div>
        <div>
          <SEOPreview
            title={seoPreviewTitle}
            description={seoDescription}
            fallbackTitle={categoryTitleFallback}
          />
        </div>
      </div>
    </Card>
  )
}
