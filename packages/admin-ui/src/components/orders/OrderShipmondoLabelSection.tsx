import type { ReactNode } from "react"

import { Button } from "@/components/ui/Button"
import { downloadShipmondoLabelPdf } from "@/features/orders/orderShipmondoLabelApi"

export function OrderShipmondoLabelOutcome(props: {
  labelError: string | null
  labelResult: {
    trackingUrl: string | null
    labelPdfBase64: string | null
    reference: string
  } | null
}): ReactNode {
  const { labelError, labelResult } = props

  return (
    <>
      {labelError !== null ? (
        <p
          className="mt-3 rounded-md border border-feedback-danger-border bg-feedback-danger-subtle px-3 py-2 text-sm text-feedback-danger-content"
          role="alert"
        >
          {labelError}
        </p>
      ) : null}

      {labelResult !== null ? (
        <div className="mt-3 rounded-md border border-feedback-success-border bg-feedback-success-subtle px-3 py-2 text-sm text-feedback-success-content">
          <p>Shipmondo label created for {labelResult.reference}.</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {labelResult.trackingUrl !== null ? (
              <a
                href={labelResult.trackingUrl}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-medium text-interactive-primary hover:text-interactive-primary-hover"
              >
                Open tracking
              </a>
            ) : null}
            {labelResult.labelPdfBase64 !== null ? (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  downloadShipmondoLabelPdf(labelResult.labelPdfBase64!, labelResult.reference)
                }}
              >
                Download label PDF
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  )
}

export function OrderShipmondoGenerateLabelButton(props: {
  disabled: boolean
  loading: boolean
  onGenerateLabel: () => void
}): ReactNode {
  return (
    <Button
      type="button"
      variant="primary"
      size="sm"
      disabled={props.disabled}
      onClick={() => {
        props.onGenerateLabel()
      }}
    >
      {props.loading ? "Generating label…" : "Generate label"}
    </Button>
  )
}
