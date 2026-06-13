import { z } from "zod"

export const createPlatformInviteBodySchema = z
  .object({
    email: z.string().trim().email().max(255),
  })
  .strict()

export const validatePlatformInviteQuerySchema = z
  .object({
    token: z.string().trim().min(1).max(128),
  })
  .strict()

export const platformInviteIdParamsSchema = z
  .object({
    id: z.string().trim().min(1).max(128),
  })
  .strict()
