import { describe, expect, it } from "vitest"

import {
  inviteTeamMemberBodySchema,
  updateTeamMemberRoleBodySchema,
} from "../src/lib/team/schemas"
import {
  CLERK_ADMIN_ROLE,
  CLERK_STAFF_ROLE,
  toClerkTeamRole,
  toMercflowTeamRole,
} from "../src/lib/team/team-roles"

describe("team roles", (): void => {
  it("maps Clerk admin role to MercFlow admin", (): void => {
    expect(toMercflowTeamRole(CLERK_ADMIN_ROLE)).toBe("admin")
  })

  it("maps Clerk member role to MercFlow staff", (): void => {
    expect(toMercflowTeamRole(CLERK_STAFF_ROLE)).toBe("staff")
    expect(toMercflowTeamRole("org:custom")).toBe("staff")
  })

  it("maps MercFlow roles back to Clerk roles", (): void => {
    expect(toClerkTeamRole("admin")).toBe(CLERK_ADMIN_ROLE)
    expect(toClerkTeamRole("staff")).toBe(CLERK_STAFF_ROLE)
  })
})

describe("team schemas", (): void => {
  it("validates invite payload", (): void => {
    const parsed = inviteTeamMemberBodySchema.safeParse({
      email: "staff@example.com",
      role: "staff",
    })
    expect(parsed.success).toBe(true)
  })

  it("rejects invalid invite email", (): void => {
    const parsed = inviteTeamMemberBodySchema.safeParse({
      email: "not-an-email",
      role: "admin",
    })
    expect(parsed.success).toBe(false)
  })

  it("validates role update payload", (): void => {
    const parsed = updateTeamMemberRoleBodySchema.safeParse({ role: "admin" })
    expect(parsed.success).toBe(true)
  })
})
