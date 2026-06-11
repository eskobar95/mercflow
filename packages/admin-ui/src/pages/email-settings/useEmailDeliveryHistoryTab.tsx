import { type Dispatch, useCallback, useEffect, useMemo, useReducer } from "react"
import { Link } from "react-router-dom"

import { EmailDeliveryStatusBadge } from "@/components/notifications/EmailDeliveryStatusBadge"
import { EmailTemplateKeyBadge } from "@/components/notifications/EmailTemplateKeyBadge"
import type { ListColumnDef } from "@/components/ui/list/types"
import type { RowActionItem } from "@/components/ui/list/RowActionsMenu"
import {
  fetchEmailDeliveriesAdmin,
  resendEmailDeliveryAdmin,
} from "@/features/notifications/emailDeliveriesAdminApi"
import type { EmailDeliveryDto } from "@/features/notifications/emailDeliveryTypes"
import { formatRelativeTimestamp } from "@/utils/formatRelativeTimestamp"

export const EMAIL_DELIVERY_PAGE_SIZE = 50

type DeliveryCol = "recipient" | "template" | "entity" | "status" | "sent_at"

type EmailDeliveryHistoryState = {
  rows: EmailDeliveryDto[]
  count: number
  page: number
  phase: "loading" | "ready" | "error"
  message: string | null
  expandedRowId: string | null
  resendingId: string | null
}

type EmailDeliveryHistoryAction =
  | { type: "reloadStart" }
  | { type: "reloadSuccess"; rows: EmailDeliveryDto[]; count: number }
  | { type: "reloadError"; message: string }
  | { type: "setPage"; page: number }
  | { type: "toggleExpanded"; rowId: string }
  | { type: "resendStart"; rowId: string }
  | { type: "resendSuccess" }
  | { type: "resendError"; message: string }

const INITIAL_STATE: EmailDeliveryHistoryState = {
  rows: [],
  count: 0,
  page: 1,
  phase: "loading",
  message: null,
  expandedRowId: null,
  resendingId: null,
}

function emailDeliveryHistoryReducer(
  state: EmailDeliveryHistoryState,
  action: EmailDeliveryHistoryAction,
): EmailDeliveryHistoryState {
  switch (action.type) {
    case "reloadStart":
      return { ...state, phase: "loading", message: null }
    case "reloadSuccess":
      return { ...state, rows: action.rows, count: action.count, phase: "ready" }
    case "reloadError":
      return { ...state, phase: "error", message: action.message }
    case "setPage":
      return { ...state, page: action.page, expandedRowId: null }
    case "toggleExpanded":
      return {
        ...state,
        expandedRowId: state.expandedRowId === action.rowId ? null : action.rowId,
      }
    case "resendStart":
      return { ...state, resendingId: action.rowId, message: null }
    case "resendSuccess":
      return { ...state, resendingId: null, page: 1, expandedRowId: null }
    case "resendError":
      return { ...state, resendingId: null, message: action.message }
    default: {
      const _exhaustive: never = action
      return _exhaustive
    }
  }
}

function canExpandRow(row: EmailDeliveryDto): boolean {
  return row.status === "failed" || row.status === "dead_letter"
}

function canResendRow(row: EmailDeliveryDto): boolean {
  return row.status === "failed" || row.status === "dead_letter"
}

function buildEntityDetailPath(row: EmailDeliveryDto): string {
  if (row.template_key === "customer-welcome") {
    return `/customers/${encodeURIComponent(row.entity_id)}`
  }
  return `/orders/${encodeURIComponent(row.entity_id)}`
}

function formatEntityLabel(row: EmailDeliveryDto): string {
  const suffix = row.entity_id.length > 8 ? row.entity_id.slice(-8) : row.entity_id
  if (row.template_key === "customer-welcome") {
    return `Customer ···${suffix}`
  }
  return `Order ···${suffix}`
}

function createColumns(): ListColumnDef<EmailDeliveryDto, DeliveryCol>[] {
  return [
    {
      id: "recipient",
      header: "Recipient",
      renderCell: (row) => (
        <span className="truncate font-medium" title={row.to_email}>
          {row.to_email}
        </span>
      ),
    },
    {
      id: "template",
      header: "Template",
      responsive: "md",
      renderCell: (row) => <EmailTemplateKeyBadge templateKey={row.template_key} />,
    },
    {
      id: "entity",
      header: "Related",
      responsive: "lg",
      renderCell: (row) => (
        <Link
          to={buildEntityDetailPath(row)}
          className="text-interactive-primary hover:text-interactive-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
          data-row-stop
        >
          {formatEntityLabel(row)}
        </Link>
      ),
    },
    {
      id: "status",
      header: "Status",
      renderCell: (row) => <EmailDeliveryStatusBadge status={row.status} />,
    },
    {
      id: "sent_at",
      header: "Sent",
      responsive: "md",
      align: "right",
      headerClassName: "text-right",
      cellClassName: "text-right tabular-nums text-content-secondary",
      renderCell: (row) => {
        const timestamp = row.sent_at ?? row.created_at
        return (
          <time dateTime={timestamp} title={new Date(timestamp).toLocaleString()}>
            {formatRelativeTimestamp(timestamp)}
          </time>
        )
      },
    },
  ]
}

export type UseEmailDeliveryHistoryTabResult = {
  state: EmailDeliveryHistoryState
  dispatch: Dispatch<EmailDeliveryHistoryAction>
  columns: ListColumnDef<EmailDeliveryDto, DeliveryCol>[]
  getRowActions: (row: EmailDeliveryDto) => RowActionItem[] | null
  onRowClick: (row: EmailDeliveryDto) => void
  reload: () => Promise<void>
  resendDelivery: (row: EmailDeliveryDto) => Promise<void>
  expandedRow: EmailDeliveryDto | null
}

export function useEmailDeliveryHistoryTab(): UseEmailDeliveryHistoryTabResult {
  const [state, dispatch] = useReducer(emailDeliveryHistoryReducer, INITIAL_STATE)
  const columns = useMemo(() => createColumns(), [])

  const reload = useCallback(async (): Promise<void> => {
    dispatch({ type: "reloadStart" })
    try {
      const offset = (state.page - 1) * EMAIL_DELIVERY_PAGE_SIZE
      const result = await fetchEmailDeliveriesAdmin({
        limit: EMAIL_DELIVERY_PAGE_SIZE,
        offset,
      })
      dispatch({ type: "reloadSuccess", rows: result.deliveries, count: result.count })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load email deliveries"
      dispatch({ type: "reloadError", message })
    }
  }, [state.page])

  useEffect(() => {
    void reload()
  }, [reload])

  const resendDelivery = useCallback(async (row: EmailDeliveryDto): Promise<void> => {
    if (!canResendRow(row)) {
      return
    }
    dispatch({ type: "resendStart", rowId: row.id })
    try {
      await resendEmailDeliveryAdmin(row.id)
      dispatch({ type: "resendSuccess" })
      const result = await fetchEmailDeliveriesAdmin({
        limit: EMAIL_DELIVERY_PAGE_SIZE,
        offset: 0,
      })
      dispatch({ type: "reloadSuccess", rows: result.deliveries, count: result.count })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to resend email"
      dispatch({ type: "resendError", message })
    }
  }, [])

  const getRowActions = useCallback(
    (row: EmailDeliveryDto): RowActionItem[] | null => {
      if (!canResendRow(row)) {
        return null
      }
      return [
        {
          id: "resend",
          label: state.resendingId === row.id ? "Resending…" : "Resend",
          onSelect: () => {
            if (state.resendingId !== null) {
              return
            }
            void resendDelivery(row)
          },
        },
      ]
    },
    [resendDelivery, state.resendingId],
  )

  const onRowClick = useCallback((row: EmailDeliveryDto): void => {
    if (canExpandRow(row)) {
      dispatch({ type: "toggleExpanded", rowId: row.id })
    }
  }, [])

  const expandedRow =
    state.expandedRowId === null
      ? null
      : (state.rows.find((row) => row.id === state.expandedRowId) ?? null)

  return {
    state,
    dispatch,
    columns,
    getRowActions,
    onRowClick,
    reload,
    resendDelivery,
    expandedRow,
  }
}
