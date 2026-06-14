import { useCallback, useMemo, useState, type Dispatch, type ReactNode } from "react"

import { Badge } from "@/components/ui/Badge"
import { Card } from "@/components/ui/Card"
import { DataTable } from "@/components/ui/list/DataTable"
import { ListEmptyState } from "@/components/ui/list/ListEmptyState"
import type { RowActionItem } from "@/components/ui/list/RowActionsMenu"
import {
  compareSortValues,
  type ListColumnDef,
  type ListSortState,
} from "@/components/ui/list/types"
import {
  formatJoinedDate,
  formatTeamMemberRoleLabel,
} from "@/features/team/teamApi"
import type { TeamMemberDto } from "@/features/team/types"

import { TeamMemberAvatar } from "./TeamMemberAvatar"
import type { TeamSettingsAction } from "./useTeamSettingsPage"

type TeamCol = "member" | "email" | "role" | "joined"

const COLUMNS: ListColumnDef<TeamMemberDto, TeamCol>[] = [
  {
    id: "member",
    header: "Member",
    sortable: true,
    skeletonVariant: "twoLine",
    getSortValue: (row) => row.name.toLocaleLowerCase(),
    renderCell: (row) => (
      <div className="flex items-center gap-3">
        <TeamMemberAvatar name={row.name} imageUrl={row.image_url} />
        <div className="min-w-0">
          <p className="truncate font-medium text-content-primary">{row.name}</p>
        </div>
      </div>
    ),
  },
  {
    id: "email",
    header: "Email",
    sortable: true,
    skeletonVariant: "text",
    getSortValue: (row) => row.email.toLocaleLowerCase(),
    renderCell: (row) => row.email,
  },
  {
    id: "role",
    header: "Role",
    sortable: true,
    skeletonVariant: "pill",
    getSortValue: (row) => row.role,
    renderCell: (row) => (
      <Badge variant={row.role === "admin" ? "accent" : "neutral"}>
        {formatTeamMemberRoleLabel(row.role)}
      </Badge>
    ),
  },
  {
    id: "joined",
    header: "Joined",
    sortable: true,
    skeletonVariant: "text",
    getSortValue: (row) => row.joined_at ?? "",
    renderCell: (row) => formatJoinedDate(row.joined_at),
  },
]

type TeamMembersTableProps = {
  members: TeamMemberDto[]
  isLoading: boolean
  showEmptyState: boolean
  currentUserId: string | null
  dispatch: Dispatch<TeamSettingsAction>
}

export function TeamMembersTable({
  members,
  isLoading,
  showEmptyState,
  currentUserId,
  dispatch,
}: TeamMembersTableProps): ReactNode {
  const [sort, setSort] = useState<ListSortState<TeamCol>>({
    column: "member",
    direction: "asc",
  })

  const onRequestSort = useCallback((columnId: TeamCol): void => {
    setSort((current) => {
      if (current.column !== columnId) {
        return { column: columnId, direction: "asc" }
      }
      if (current.direction === "asc") {
        return { column: columnId, direction: "desc" }
      }
      if (current.direction === "desc") {
        return { column: null, direction: "none" }
      }
      return { column: columnId, direction: "asc" }
    })
  }, [])

  const sortedMembers = useMemo(() => {
    if (!sort.column || sort.direction === "none") {
      return members
    }

    const column = COLUMNS.find((entry) => entry.id === sort.column)
    if (!column?.getSortValue) {
      return members
    }

    const direction = sort.direction === "asc" ? 1 : -1
    return members.toSorted((left, right) => {
      const leftValue = column.getSortValue?.(left)
      const rightValue = column.getSortValue?.(right)
      if (leftValue === undefined || rightValue === undefined) {
        return 0
      }
      return compareSortValues(leftValue, rightValue) * direction
    })
  }, [members, sort.column, sort.direction])

  const getRowActions = useCallback(
    (row: TeamMemberDto): RowActionItem[] => {
      if (currentUserId !== null && row.clerk_user_id === currentUserId) {
        return []
      }

      return [
        {
          id: "change-role",
          label: "Change role",
          onSelect: () => {
            dispatch({ type: "openRoleDialog", member: row })
          },
        },
        {
          id: "revoke",
          label: "Revoke access",
          destructive: true,
          onSelect: () => {
            dispatch({ type: "openRevoke", member: row })
          },
        },
      ]
    },
    [currentUserId, dispatch],
  )

  return (
    <Card className="mt-6 overflow-hidden">
      <div className="border-b border-border-subtle px-6 py-4">
        <h2 className="text-base font-semibold text-content-primary">Team members</h2>
        <p className="mt-1 text-sm text-content-secondary">
          Manage who can access your store admin and what they can do.
        </p>
      </div>

      {showEmptyState ? (
        <ListEmptyState
          bare
          title="Your team is just you"
          description="Invite colleagues to help manage your store."
        />
      ) : (
        <DataTable
          aria-label="Team members"
          caption="Store admin team members"
          columns={COLUMNS}
          data={sortedMembers}
          getRowId={(row) => row.clerk_user_id}
          sortState={sort}
          onRequestSort={onRequestSort}
          getRowActions={getRowActions}
          isLoading={isLoading}
          emptyState={
            <ListEmptyState
              bare
              title="No team members"
              description="Invite someone to get started."
            />
          }
        />
      )}
    </Card>
  )
}
