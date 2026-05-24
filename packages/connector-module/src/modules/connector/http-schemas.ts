import { z } from "zod"

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
