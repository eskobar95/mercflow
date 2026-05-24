import { Link, useNavigate, useParams } from "react-router-dom"

import { Button } from "@/components/ui/Button"
import { useConnectorDetailMeta } from "@/features/connectors/useConnectorsOverview"

/**
 * Placeholder detail route for Sprint 3 configuration forms (`/settings/connectors/:connectorType`).
 */
export function ConnectorConfigurePage(): JSX.Element {
  const { connectorType } = useParams()
  const navigate = useNavigate()
  const meta = useConnectorDetailMeta(connectorType)

  if (meta.title === null || meta.type === null) {
    return (
      <div className="mx-auto flex w-full max-w-lg flex-col gap-6 px-6 py-12">
        <p className="text-sm text-content-secondary">This connector shortcut is unknown.</p>
        <Link
          className="text-sm font-medium text-interactive-primary hover:text-interactive-primary-hover"
          to="/settings/connectors"
        >
          ← Back to Connectors
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-6 py-10">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-content-tertiary">
          Settings · Connectors
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-content-primary">
          Configure {meta.title}
        </h1>
        <p className="mt-3 text-sm text-content-secondary">
          Dedicated credential forms arrive in Sprint 3. Reach this shell from Settings → Connectors for
          every supported integration type — no Guapo assumptions are baked here.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button variant="secondary" type="button" onClick={() => navigate(-1)}>
          Back
        </Button>
        <Button
          variant="ghost"
          type="button"
          onClick={() => {
            navigate("/settings/connectors")
          }}
        >
          All connectors
        </Button>
      </div>
      <p className="text-xs text-content-tertiary">
        /settings/connectors/{meta.type}
      </p>
    </div>
  )
}
