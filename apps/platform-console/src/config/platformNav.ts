export type PlatformNavItem = {
  id: string
  label: string
  href: string
  description: string
}

export const PLATFORM_NAV_ITEMS: PlatformNavItem[] = [
  {
    id: "tenants",
    label: "Tenants",
    href: "/tenants",
    description: "Provision and manage merchant stores",
  },
  {
    id: "queues",
    label: "Queues",
    href: "/queues",
    description: "BullMQ queue health and DLQ drill-down",
  },
  {
    id: "email",
    label: "Email",
    href: "/email",
    description: "Cross-tenant delivery history and SES status",
  },
  {
    id: "system",
    label: "System",
    href: "/system",
    description: "Hetzner, Neon, and Redis metrics",
  },
  {
    id: "audit",
    label: "Audit",
    href: "/audit",
    description: "Operator action audit log",
  },
]
