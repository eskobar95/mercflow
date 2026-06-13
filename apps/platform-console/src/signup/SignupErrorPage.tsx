type SignupErrorPageProps = {
  title: string
  message: string
  statusCode?: number
}

export function SignupErrorPage({
  title,
  message,
  statusCode,
}: SignupErrorPageProps): React.ReactElement {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-surface-appCanvas px-6">
      <div className="max-w-md rounded-lg border border-border-subtle bg-surface-raised p-8 text-center shadow-sm">
        {statusCode !== undefined ? (
          <p className="text-xs font-medium uppercase tracking-wide text-content-secondary">
            Error {statusCode}
          </p>
        ) : null}
        <h1 className="mt-2 text-lg font-semibold text-content-primary">{title}</h1>
        <p className="mt-2 text-sm text-content-secondary">{message}</p>
      </div>
    </div>
  )
}
