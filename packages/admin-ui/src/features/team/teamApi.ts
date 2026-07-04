import {
  buildMedusaAdminJsonHeaders,
  parseMedusaAdminJsonResponse,
  readMedusaAdminHttpErrorMessage,
  resolveMedusaAdminBackendUrl,
} from "@/medusa-admin/medusaAdminFetch"

import type {
  InviteTeamMemberInput,
  TeamInvitationDto,
  TeamMemberDto,
  TeamMemberRole,
  UpdateTeamMemberRoleInput,
} from "./types"

function teamBase(): string {
  const base = resolveMedusaAdminBackendUrl()
  if (base === null) {
    throw new Error(
      "Missing VITE_MEDUSA_ADMIN_BACKEND_URL. Set it to your Medusa backend origin (e.g. http://localhost:9000).",
    )
  }
  return `${base}/admin/team`
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function parseTeamMember(value: unknown): TeamMemberDto | null {
  if (!isRecord(value)) {
    return null
  }

  const clerkUserId =
    typeof value.clerk_user_id === "string" ? value.clerk_user_id : null
  const name = typeof value.name === "string" ? value.name : null
  const email = typeof value.email === "string" ? value.email : null
  const role = value.role === "admin" || value.role === "staff" ? value.role : null

  if (clerkUserId === null || name === null || email === null || role === null) {
    return null
  }

  return {
    clerk_user_id: clerkUserId,
    name,
    email,
    role,
    image_url: typeof value.image_url === "string" ? value.image_url : null,
    joined_at: typeof value.joined_at === "string" ? value.joined_at : null,
  }
}

function parseTeamMembers(payload: unknown): TeamMemberDto[] {
  if (!isRecord(payload) || !Array.isArray(payload.members)) {
    return []
  }

  return payload.members
    .map((member) => parseTeamMember(member))
    .filter((member): member is TeamMemberDto => member !== null)
}

function parseTeamInvitation(value: unknown): TeamInvitationDto | null {
  if (!isRecord(value)) {
    return null
  }

  const invitationId =
    typeof value.invitation_id === "string" ? value.invitation_id : null
  const email = typeof value.email === "string" ? value.email : null
  const role = value.role === "admin" || value.role === "staff" ? value.role : null
  const status = value.status === "pending" ? value.status : null

  if (invitationId === null || email === null || role === null || status === null) {
    return null
  }

  return {
    invitation_id: invitationId,
    email,
    role,
    status,
    created_at: typeof value.created_at === "string" ? value.created_at : null,
  }
}

function parseTeamInvitations(payload: unknown): TeamInvitationDto[] {
  if (!isRecord(payload) || !Array.isArray(payload.invitations)) {
    return []
  }

  return payload.invitations
    .map((invitation) => parseTeamInvitation(invitation))
    .filter((invitation): invitation is TeamInvitationDto => invitation !== null)
}

export type TeamMembersListResult = {
  members: TeamMemberDto[]
  invitations: TeamInvitationDto[]
}

export async function listTeamMembers(): Promise<TeamMembersListResult> {
  const response = await fetch(`${teamBase()}/members`, {
    method: "GET",
    headers: buildMedusaAdminJsonHeaders(),
  })

  if (!response.ok) {
    throw new Error(await readMedusaAdminHttpErrorMessage(response))
  }

  const payload = await parseMedusaAdminJsonResponse(response)
  return {
    members: parseTeamMembers(payload),
    invitations: parseTeamInvitations(payload),
  }
}

export async function inviteTeamMember(input: InviteTeamMemberInput): Promise<void> {
  const response = await fetch(`${teamBase()}/invite`, {
    method: "POST",
    headers: buildMedusaAdminJsonHeaders(),
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    throw new Error(await readMedusaAdminHttpErrorMessage(response))
  }
}

export async function updateTeamMemberRole(
  clerkUserId: string,
  input: UpdateTeamMemberRoleInput,
): Promise<TeamMemberDto> {
  const response = await fetch(
    `${teamBase()}/members/${encodeURIComponent(clerkUserId)}`,
    {
      method: "PATCH",
      headers: buildMedusaAdminJsonHeaders(),
      body: JSON.stringify(input),
    },
  )

  if (!response.ok) {
    throw new Error(await readMedusaAdminHttpErrorMessage(response))
  }

  const payload = await parseMedusaAdminJsonResponse(response)
  if (!isRecord(payload)) {
    throw new TypeError("Team member response could not be parsed")
  }

  const member = parseTeamMember(payload.member)
  if (member === null) {
    throw new TypeError("Team member response could not be parsed")
  }

  return member
}

export async function revokeTeamMember(clerkUserId: string): Promise<void> {
  const response = await fetch(
    `${teamBase()}/members/${encodeURIComponent(clerkUserId)}`,
    {
      method: "DELETE",
      headers: buildMedusaAdminJsonHeaders(),
    },
  )

  if (!response.ok) {
    throw new Error(await readMedusaAdminHttpErrorMessage(response))
  }
}

export async function revokeTeamInvitation(invitationId: string): Promise<void> {
  const response = await fetch(
    `${teamBase()}/invitations/${encodeURIComponent(invitationId)}`,
    {
      method: "DELETE",
      headers: buildMedusaAdminJsonHeaders(),
    },
  )

  if (!response.ok) {
    throw new Error(await readMedusaAdminHttpErrorMessage(response))
  }
}

export function formatTeamMemberRoleLabel(role: TeamMemberRole): string {
  return role === "admin" ? "Admin" : "Staff"
}

export function formatJoinedDate(joinedAt: string | null): string {
  if (joinedAt === null) {
    return "—"
  }

  const date = new Date(joinedAt)
  if (Number.isNaN(date.getTime())) {
    return "—"
  }

  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date)
}
