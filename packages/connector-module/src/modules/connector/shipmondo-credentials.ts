import { z } from "zod"

/**
 * Stored JSON shape encrypted at rest inside `connector_config.credentials_encrypted`.
 * Never log or serialize this shape to HTTP responses — only decrypted server-side methods may read it.
 */
export const shipmondoCredentialsSchema = z.object({
  api_user: z.string().min(1),
  api_key: z.string().min(1),
  shipping_module_key: z.string().nullable().optional(),
})

export type ShipmondoCredentials = z.infer<typeof shipmondoCredentialsSchema>
