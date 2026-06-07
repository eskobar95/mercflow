import type { Dispatch, ReactNode } from "react"

import { Card } from "@/components/ui/Card"
import { FormField } from "@/components/ui/FormField"
import { Input } from "@/components/ui/Input"

import type { CategoryContentFormAction } from "./categoryContentFormState"

type CategoryContentImagesSectionProps = {
  formId: string
  ogUrl: string
  bannerUrl: string
  disabled: boolean
  dispatchForm: Dispatch<CategoryContentFormAction>
}

export function CategoryContentImagesSection({
  formId,
  ogUrl,
  bannerUrl,
  disabled,
  dispatchForm,
}: CategoryContentImagesSectionProps): ReactNode {
  return (
    <Card className="space-y-4">
      <h2 className="text-lg font-semibold text-content-primary">Images</h2>
      <p className="mt-1 text-sm text-content-secondary">
        Open Graph and banner values are persisted on the MercFlow CMS row (IDs or URLs, depending
        on your environment).
      </p>
      <div className="space-y-4">
        <FormField
          label="Open Graph media reference"
          htmlFor={`${formId}-og-url`}
          hint="Sent as seo_og_image_id on save."
        >
          <Input
            id={`${formId}-og-url`}
            type="text"
            value={ogUrl}
            onChange={(e) => {
              dispatchForm({ type: "setOgUrl", value: e.target.value })
            }}
            disabled={disabled}
            autoComplete="off"
            placeholder="Media id or URL"
          />
        </FormField>
        <FormField
          label="Banner media reference"
          htmlFor={`${formId}-banner-url`}
          hint="Sent as banner_image_id on save."
        >
          <Input
            id={`${formId}-banner-url`}
            type="text"
            value={bannerUrl}
            onChange={(e) => {
              dispatchForm({ type: "setBannerUrl", value: e.target.value })
            }}
            disabled={disabled}
            autoComplete="off"
            placeholder="Media id or URL"
          />
        </FormField>
      </div>
    </Card>
  )
}
