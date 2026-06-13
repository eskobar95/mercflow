/// <reference types="vite/client" />

type ImportMetaEnv = {
  readonly VITE_PLATFORM_CLERK_PUBLISHABLE_KEY: string
  readonly VITE_PLATFORM_BACKEND_URL: string
  readonly VITE_PLATFORM_ALLOWED_EMAIL_DOMAIN: string
  readonly VITE_CLERK_PUBLISHABLE_KEY: string
  readonly VITE_MERCFLOW_PUBLIC_SIGNUP: string
}

type ImportMeta = {
  readonly env: ImportMetaEnv
}
