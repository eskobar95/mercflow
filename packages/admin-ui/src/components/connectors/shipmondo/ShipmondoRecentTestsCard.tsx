import type { ReactNode } from "react"

import { Badge } from "@/components/ui/Badge"
import { Card } from "@/components/ui/Card"
import type { ShipmondoAdminLogDto } from "@/features/connectors/shipmondoTypes"

import { formatLastTestedAt } from "./shipmondoWorkspaceState"

type ShipmondoRecentTestsCardProps = {
  recentLogs: ShipmondoAdminLogDto[]
}

export function ShipmondoRecentTestsCard({ recentLogs }: ShipmondoRecentTestsCardProps): ReactNode {
  return (
    <Card elevation="flat" compact>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-content-primary">Recent tests</p>
          <p className="text-xs text-content-tertiary">
            Last five probe attempts (success or failure). Shipmondo never logs secrets.
          </p>
        </div>
      </div>

      {recentLogs.length === 0 ? (
        <p className="mt-4 text-sm text-content-secondary">No probes recorded yet.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {recentLogs.map((log) => (
            <li
              key={log.id}
              className="flex flex-col gap-2 rounded-sm border border-border-subtle bg-surface-subtle p-3 md:flex-row md:items-center md:justify-between"
            >
              <div className="space-y-1">
                <p className="text-sm text-content-primary">{log.message}</p>
                <p className="text-xs text-content-tertiary">
                  {formatLastTestedAt(log.createdAt)}
                </p>
              </div>
              <Badge variant={log.success ? "success" : "danger"} dot>
                {log.success ? "Success" : "Failed"}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
