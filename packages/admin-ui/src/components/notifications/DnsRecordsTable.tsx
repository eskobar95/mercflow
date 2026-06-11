import { useCallback, useState, type ReactNode } from "react"

import { Button } from "@/components/ui/Button"
import type { DomainDnsRecordRow } from "@/features/notifications/types"

type CopyState = "idle" | "copied" | "failed"

type DnsRecordsTableProps = {
  records: DomainDnsRecordRow[]
}

function recordRowKey(record: DomainDnsRecordRow, index: number): string {
  return `${record.type}-${record.name}-${index}`
}

export function DnsRecordsTable({ records }: DnsRecordsTableProps): ReactNode {
  const [copyStateByKey, setCopyStateByKey] = useState<Record<string, CopyState>>({})

  const handleCopy = useCallback(async (key: string, value: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(value)
      setCopyStateByKey((current) => ({ ...current, [key]: "copied" }))
    } catch {
      setCopyStateByKey((current) => ({ ...current, [key]: "failed" }))
    }
  }, [])

  if (records.length === 0) {
    return (
      <p className="text-sm text-content-secondary">
        DNS records will appear here after you set up your sending domain.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border-subtle">
      <table className="min-w-full divide-y divide-border-subtle text-sm">
        <caption className="sr-only">DNS records required for email domain verification</caption>
        <thead className="bg-surface-subtle">
          <tr>
            <th scope="col" className="px-4 py-3 text-left font-medium text-content-secondary">
              Type
            </th>
            <th scope="col" className="px-4 py-3 text-left font-medium text-content-secondary">
              Name
            </th>
            <th scope="col" className="px-4 py-3 text-left font-medium text-content-secondary">
              Value
            </th>
            <th scope="col" className="px-4 py-3 text-right font-medium text-content-secondary">
              <span className="sr-only">Copy value</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-subtle bg-surface-default">
          {records.map((record, index) => {
            const rowKey = recordRowKey(record, index)
            const copyState = copyStateByKey[rowKey] ?? "idle"
            return (
              <tr key={rowKey}>
                <td className="whitespace-nowrap px-4 py-3 font-medium text-content-primary">
                  {record.type}
                </td>
                <td className="max-w-xs break-all px-4 py-3 font-mono text-xs text-content-primary">
                  {record.name}
                </td>
                <td className="max-w-md break-all px-4 py-3 font-mono text-xs text-content-secondary">
                  {record.value}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      void handleCopy(rowKey, record.value)
                    }}
                  >
                    {copyState === "copied" ? "Copied" : "Copy"}
                  </Button>
                  {copyState === "failed" ? (
                    <span className="mt-1 block text-xs text-content-danger" role="alert">
                      Copy failed
                    </span>
                  ) : null}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
