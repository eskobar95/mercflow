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
