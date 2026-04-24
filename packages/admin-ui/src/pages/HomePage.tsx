import { TokenIntegrationProof } from "@/components/TokenIntegrationProof"
import { PageTransition } from "@/components/ui/PageTransition"

/**
 * Default home route. Hosts the token integration proof until product routes exist.
 */
export function HomePage(): JSX.Element {
  return (
    <PageTransition>
      <div className="p-8">
        <TokenIntegrationProof />
      </div>
    </PageTransition>
  )
}
