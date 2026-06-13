import { useSignupWizard } from "@/signup/SignupWizardContext"

export function SignupStep7Ready(): React.ReactElement {
  const { state } = useSignupWizard()
  const adminUrl = state.provisioning.adminUrl ?? "#"
  const tenantUrl = state.provisioning.tenantUrl ?? "#"

  return (
    <section className="rounded-lg border border-border-subtle bg-surface-raised p-6">
      <h2 className="text-lg font-semibold text-content-primary">Your store is ready!</h2>
      <p className="mt-1 text-sm text-content-secondary">
        {state.storeName} has been provisioned with a Medusa store, sales channel,
        publishable API key, Clerk organization, and domain routing.
      </p>

      <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-content-secondary">
        <li>Store Admin: sign in with the Clerk account you created in step 2.</li>
        <li>Storefront domain: {tenantUrl}</li>
        <li>Platform subscription: active on your saved payment method.</li>
      </ul>

      <div className="mt-6">
        <a
          href={adminUrl}
          className="inline-flex rounded-md bg-interactive-primary px-4 py-2 text-sm font-medium text-content-inverse transition-opacity hover:bg-interactive-primary-hover"
        >
          Open Store Admin
        </a>
      </div>
    </section>
  )
}
