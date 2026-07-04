import { createClerkClient } from "@clerk/backend"

function getStoreAdminClerkSecretKey(): string {
  const secretKey = process.env.CLERK_SECRET_KEY?.trim()
  if (!secretKey) {
    throw new Error("CLERK_SECRET_KEY is not configured")
  }
  return secretKey
}

export function getStoreAdminClerkClient(): ReturnType<typeof createClerkClient> {
  return createClerkClient({ secretKey: getStoreAdminClerkSecretKey() })
}

export type CreateClerkOrgResult = {
  organization_id: string
  created: boolean
}

function formatClerkError(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "errors" in error &&
    Array.isArray((error as { errors: unknown }).errors)
  ) {
    const messages = (error as { errors: Array<{ message?: string }> }).errors
      .map((entry) => entry.message)
      .filter((message): message is string => typeof message === "string" && message.length > 0)

    if (messages.length > 0) {
      return messages.join("; ")
    }
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message
  }

  return "Clerk organization request failed"
}

export async function createClerkOrgForTenant(input: {
  storeId: string
  storeName: string
  clerkUserId: string
}): Promise<CreateClerkOrgResult> {
  const clerk = getStoreAdminClerkClient()

  const existing = await clerk.organizations.getOrganizationList({
    query: input.storeId,
    limit: 10,
  })

  const matched = existing.data.find(
    (org) =>
      org.publicMetadata?.store_id === input.storeId ||
      org.name === input.storeName,
  )

  if (matched) {
    return { organization_id: matched.id, created: false }
  }

  try {
    const organization = await clerk.organizations.createOrganization({
      name: input.storeName,
      createdBy: input.clerkUserId,
      publicMetadata: {
        store_id: input.storeId,
      },
    })

    return { organization_id: organization.id, created: true }
  } catch (error) {
    throw new Error(formatClerkError(error))
  }
}

export async function ensureClerkOrgAdminMembership(input: {
  organizationId: string
  clerkUserId: string
}): Promise<void> {
  const clerk = getStoreAdminClerkClient()

  const memberships = await clerk.organizations.getOrganizationMembershipList({
    organizationId: input.organizationId,
    limit: 100,
  })

  const existing = memberships.data.find(
    (membership) => membership.publicUserData?.userId === input.clerkUserId,
  )

  if (existing) {
    return
  }

  await clerk.organizations.createOrganizationMembership({
    organizationId: input.organizationId,
    userId: input.clerkUserId,
    role: "org:admin",
  })
}

export async function ensureClerkOrgStoreIdClaim(input: {
  organizationId: string
  storeId: string
}): Promise<void> {
  const clerk = getStoreAdminClerkClient()
  const organization = await clerk.organizations.getOrganization({
    organizationId: input.organizationId,
  })

  if (organization.publicMetadata?.store_id === input.storeId) {
    return
  }

  await clerk.organizations.updateOrganization(input.organizationId, {
    publicMetadata: {
      ...organization.publicMetadata,
      store_id: input.storeId,
    },
  })
}
