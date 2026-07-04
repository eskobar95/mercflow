export type PlatformQueueDefinition = {
  name: string
  queueName: string
  dlqName: string
}

export const PLATFORM_QUEUE_DEFINITIONS: PlatformQueueDefinition[] = [
  {
    name: "notifications",
    queueName: "mercflow-notifications",
    dlqName: "mercflow-notifications-dead",
  },
  {
    name: "subscriptions",
    queueName: "mercflow-subscriptions",
    dlqName: "mercflow-subscriptions-dead",
  },
  {
    name: "feed-invalidation",
    queueName: "mercflow-feed-invalidation",
    dlqName: "mercflow-feed-invalidation-dead",
  },
  {
    name: "sitemap",
    queueName: "mercflow-sitemap",
    dlqName: "mercflow-sitemap-dead",
  },
  {
    name: "provision-tenant",
    queueName: "mercflow-provision-tenant",
    dlqName: "mercflow-provision-tenant-dead",
  },
]

const queueByName = new Map(
  PLATFORM_QUEUE_DEFINITIONS.map((definition) => [definition.name, definition]),
)

export function resolvePlatformQueueDefinition(
  name: string,
): PlatformQueueDefinition | null {
  return queueByName.get(name) ?? null
}

export function listPlatformQueueNames(): string[] {
  return PLATFORM_QUEUE_DEFINITIONS.map((definition) => definition.name)
}
