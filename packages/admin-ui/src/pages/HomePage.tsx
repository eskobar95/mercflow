import { TokenIntegrationProof } from "@/components/TokenIntegrationProof"

/**
 * Default home route. Hosts the token integration proof until product routes exist.
 */
export function HomePage(): JSX.Element {
  return (
    <div className="p-8">
      <TokenIntegrationProof />
    </div>
  )
}
