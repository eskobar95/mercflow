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
      org.slug === input.storeId ||
      org.name === input.storeName,
  )

  if (matched) {
    return { organization_id: matched.id, created: false }
  }

  const organization = await clerk.organizations.createOrganization({
    name: input.storeName,
    slug: input.storeId.replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 48),
    createdBy: input.clerkUserId,
    publicMetadata: {
      store_id: input.storeId,
    },
  })

  return { organization_id: organization.id, created: true }
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
