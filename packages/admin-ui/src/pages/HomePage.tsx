import { SmokeTest } from "@/components/SmokeTest"
import { TokenIntegrationProof } from "@/components/TokenIntegrationProof"

/**
 * Default home route. Hosts the token integration proof and smoke test.
 */
export function HomePage(): JSX.Element {
  return (
    <div className="p-8 space-y-6">
      <TokenIntegrationProof />
      <SmokeTest />
    </div>
  )
}
