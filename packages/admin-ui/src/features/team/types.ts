export type TeamMemberRole = "admin" | "staff"

export type TeamMemberDto = {
  clerk_user_id: string
  name: string
  email: string
  role: TeamMemberRole
  image_url: string | null
  joined_at: string | null
}

export type TeamInvitationDto = {
  invitation_id: string
  email: string
  role: TeamMemberRole
  status: "pending"
  created_at: string | null
}

export type InviteTeamMemberInput = {
  email: string
  role: TeamMemberRole
}

export type UpdateTeamMemberRoleInput = {
  role: TeamMemberRole
}
