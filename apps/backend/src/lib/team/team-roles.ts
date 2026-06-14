export type TeamMemberRole = "admin" | "staff"

export const CLERK_ADMIN_ROLE = "org:admin"
export const CLERK_STAFF_ROLE = "org:member"

export function toMercflowTeamRole(clerkRole: string): TeamMemberRole {
  if (clerkRole === CLERK_ADMIN_ROLE) {
    return "admin"
  }
  return "staff"
}

export function toClerkTeamRole(role: TeamMemberRole): string {
  return role === "admin" ? CLERK_ADMIN_ROLE : CLERK_STAFF_ROLE
}
