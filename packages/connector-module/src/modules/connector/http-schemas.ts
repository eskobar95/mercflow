import { z } from "zod"

export const patchPlunkConnectorSchema = z
  .object({
    api_key: z.string().min(1).optional(),
    from_email: z.string().trim().email().nullable().optional(),
    from_name: z.string().trim().max(200).nullable().optional(),
    active: z.boolean().optional(),
  })
  .strict()

export type PatchPlunkConnectorBody = z.infer<typeof patchPlunkConnectorSchema>

export const postPlunkConnectorTestSchema = z
  .object({
    test_email: z.string().trim().email().optional(),
  })
  .strict()

export type PostPlunkConnectorTestBody = z.infer<typeof postPlunkConnectorTestSchema>

/** Public container ID pattern (ASCII uppercase letters and digits after `GTM-`). */
export const GTM_CONTAINER_ID_PATTERN = /^GTM-[A-Z0-9]+$/

export const gtmContainerIdValueSchema = z
  .string()
  .trim()
  .transform((value) => value.toUpperCase())
  .pipe(
    z
      .string()
      .regex(
        GTM_CONTAINER_ID_PATTERN,
        "container_id must match format GTM- followed by letters and digits (e.g. GTM-ABCDEF)"
      )
  )

export const gtmPatchBodySchema = z
  .object({
    container_id: gtmContainerIdValueSchema,
  })
  .strict()
