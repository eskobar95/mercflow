import { MedusaError } from "@medusajs/utils"

import { getStoreAdminClerkClient } from "../clerk-store-admin/clerk-org-provisioning"

import {
  toClerkTeamRole,
  toMercflowTeamRole,
  type TeamMemberRole,
} from "./team-roles"

export type TeamMemberDto = {
  clerk_user_id: string
  name: string
  email: string
  role: TeamMemberRole
  image_url: string | null
  joined_at: string | null
}

function resolveMemberName(input: {
  firstName: string | null | undefined
  lastName: string | null | undefined
  email: string
}): string {
  const fullName = [input.firstName, input.lastName]
    .filter((part): part is string => typeof part === "string" && part.trim() !== "")
    .join(" ")
    .trim()

  if (fullName !== "") {
    return fullName
  }

  const localPart = input.email.split("@")[0]?.trim()
  return localPart !== undefined && localPart !== "" ? localPart : "Team member"
}

function mapMembershipToDto(membership: {
  role: string
  createdAt: number
  publicUserData?: {
    userId?: string | null
    firstName?: string | null
    lastName?: string | null
    imageUrl?: string | null
    identifier?: string | null
  } | null
}): TeamMemberDto | null {
  const userId = membership.publicUserData?.userId
  const email = membership.publicUserData?.identifier?.trim() ?? ""

  if (typeof userId !== "string" || userId === "" || email === "") {
    return null
  }

  return {
    clerk_user_id: userId,
    name: resolveMemberName({
      firstName: membership.publicUserData?.firstName,
      lastName: membership.publicUserData?.lastName,
      email,
    }),
    email,
    role: toMercflowTeamRole(membership.role),
    image_url: membership.publicUserData?.imageUrl ?? null,
    joined_at: Number.isFinite(membership.createdAt)
      ? new Date(membership.createdAt).toISOString()
      : null,
  }
}

function wrapClerkError(error: unknown, fallbackMessage: string): never {
  if (error instanceof MedusaError) {
    throw error
  }

  const message = error instanceof Error ? error.message : fallbackMessage
  throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, message)
}

export async function listTeamMembers(organizationId: string): Promise<TeamMemberDto[]> {
  try {
    const clerk = getStoreAdminClerkClient()
    const response = await clerk.organizations.getOrganizationMembershipList({
      organizationId,
      limit: 100,
    })

    return response.data
      .map((membership) => mapMembershipToDto(membership))
      .filter((member): member is TeamMemberDto => member !== null)
  } catch (error) {
    wrapClerkError(error, "Failed to list team members")
  }
}

export async function inviteTeamMember(input: {
  organizationId: string
  email: string
  role: TeamMemberRole
}): Promise<{ invitation_id: string }> {
  try {
    const clerk = getStoreAdminClerkClient()
    const invitation = await clerk.organizations.createOrganizationInvitation({
      organizationId: input.organizationId,
      emailAddress: input.email,
      role: toClerkTeamRole(input.role),
    })

    return { invitation_id: invitation.id }
  } catch (error) {
    wrapClerkError(error, "Failed to send team invitation")
  }
}

export async function updateTeamMemberRole(input: {
  organizationId: string
  clerkUserId: string
  role: TeamMemberRole
}): Promise<TeamMemberDto> {
  try {
    const clerk = getStoreAdminClerkClient()
    const membership = await clerk.organizations.updateOrganizationMembership({
      organizationId: input.organizationId,
      userId: input.clerkUserId,
      role: toClerkTeamRole(input.role),
    })

    const mapped = mapMembershipToDto(membership)
    if (mapped === null) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        "Updated membership could not be mapped",
      )
    }

    return mapped
  } catch (error) {
    wrapClerkError(error, "Failed to update team member role")
  }
}

export async function revokeTeamMember(input: {
  organizationId: string
  clerkUserId: string
}): Promise<void> {
  try {
    const clerk = getStoreAdminClerkClient()
    await clerk.organizations.deleteOrganizationMembership({
      organizationId: input.organizationId,
      userId: input.clerkUserId,
    })
  } catch (error) {
    wrapClerkError(error, "Failed to revoke team member access")
  }
}
