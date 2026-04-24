/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Medusa backend origin for admin API calls (e.g. `http://localhost:9000`). No trailing slash. */
  readonly VITE_MEDUSA_ADMIN_BACKEND_URL?: string
  /** Optional Bearer token for local dev when cookie sessions are impractical across origins. */
  readonly VITE_MEDUSA_ADMIN_BEARER_TOKEN?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
