import { z } from "zod"

export const teamMemberRoleSchema = z.enum(["admin", "staff"])

export const inviteTeamMemberBodySchema = z
  .object({
    email: z.string().trim().email(),
    role: teamMemberRoleSchema,
  })
  .strict()

export const updateTeamMemberRoleBodySchema = z
  .object({
    role: teamMemberRoleSchema,
  })
  .strict()

export const teamMemberParamsSchema = z
  .object({
    clerk_user_id: z.string().trim().min(1),
  })
  .strict()
