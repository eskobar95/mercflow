import type { Context } from "@medusajs/types"
import { MedusaService } from "@medusajs/framework/utils"
import { MedusaError } from "@medusajs/utils"

import {
  MercflowInventoryConfig,
  MercflowOrderNote,
  MercflowPurchaseOrder,
  MercflowPurchaseOrderLine,
  MercflowPurchaseOrderReceipt,
  MercflowSupplier,
} from "./models"
import type {
  CreateOrderNoteInput,
  CreatePurchaseOrderInput,
  CreateSupplierInput,
  MercflowInventoryConfigRecord,
  MercflowOrderNoteRecord,
  MercflowPurchaseOrderLineRecord,
  MercflowPurchaseOrderReceiptRecord,
  MercflowPurchaseOrderRecord,
  MercflowSupplierRecord,
  PurchaseOrderDetail,
  PurchaseOrderLineSummary,
  PurchaseOrderStatus,
  ReceivePurchaseOrderInput,
  UpdateSupplierInput,
  UpsertInventoryConfigInput,
} from "./types"
import { computeIncomingForLine } from "./inventory-overview-math"
import type { InventoryMovementRow } from "./inventory-overview-types"
import { PURCHASE_ORDER_STATUSES } from "./types"
import { runWithTenantScope } from "./tenant-scope"

const NOTE_CONTENT_MAX = 4000

const PO_STATUS_TRANSITIONS: Partial<Record<PurchaseOrderStatus, PurchaseOrderStatus[]>> = {
  draft: ["ordered", "cancelled"],
  ordered: ["partially_received", "received", "cancelled"],
  partially_received: ["received", "cancelled"],
}

const RECEIVABLE_PO_STATUSES: PurchaseOrderStatus[] = ["ordered", "partially_received"]

function assertPositiveReceivedQty(qty: number): void {
  if (!Number.isFinite(qty) || !Number.isInteger(qty) || qty < 1) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "received_qty must be a positive integer"
    )
  }
}

function sumReceiptQty(receipts: MercflowPurchaseOrderReceiptRecord[]): number {
  return receipts.reduce((sum, row) => sum + Number(row.received_qty), 0)
}

function deriveReceiveStatus(lines: PurchaseOrderLineSummary[]): PurchaseOrderStatus {
  const allFullyReceived = lines.every((line) => line.received_total >= line.ordered_qty)
  return allFullyReceived ? "received" : "partially_received"
}

function parseExpectedDate(value: string | null | undefined): Date | null {
  if (value === undefined || value === null) {
    return null
  }
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "expected_date is invalid")
  }
  return d
}

function normalizeOptionalText(value: string | null | undefined): string | null {
  if (value === undefined || value === null) {
    return null
  }
  const trimmed = value.trim()
  return trimmed === "" ? null : trimmed
}

class InventoryModuleService extends MedusaService({
  MercflowOrderNote,
  MercflowSupplier,
  MercflowPurchaseOrder,
  MercflowPurchaseOrderLine,
  MercflowPurchaseOrderReceipt,
  MercflowInventoryConfig,
}) {
  async withTenant<T>(
    storeId: string,
    fn: (context: Context) => Promise<T>
  ): Promise<T> {
    const baseRepo = (
      this as unknown as {
        baseRepository_: Parameters<typeof runWithTenantScope>[0]
      }
    ).baseRepository_
    return runWithTenantScope(baseRepo, storeId, fn)
  }

  // --- Order notes (S008) ---

  async listOrderNotes(
    storeId: string,
    orderId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<{ notes: MercflowOrderNoteRecord[]; count: number }> {
    return this.withTenant(storeId, async (context) => {
      const [rows, count] = await this.listAndCountMercflowOrderNotes(
        {
          store_id: storeId,
          order_id: orderId,
        },
        {
          order: { created_at: "DESC" },
          skip: options?.offset ?? 0,
          take: options?.limit ?? 50,
        },
        context
      )
      return {
        notes: rows.map((row) => this.toNoteRecord(row as MercflowOrderNoteRecord)),
        count,
      }
    })
  }

  async createOrderNote(
    storeId: string,
    orderId: string,
    input: CreateOrderNoteInput
  ): Promise<MercflowOrderNoteRecord> {
    const content = input.content.trim()
    if (content === "") {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Note content is required")
    }
    if (content.length > NOTE_CONTENT_MAX) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Note content must not exceed ${NOTE_CONTENT_MAX} characters`
      )
    }
    const createdBy = (input.created_by ?? "admin").trim()
    if (createdBy === "") {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "created_by is required")
    }

    return this.withTenant(storeId, async (context) => {
      const created = await this.createMercflowOrderNotes(
        {
          store_id: storeId,
          order_id: orderId,
          content,
          created_by: createdBy,
        },
        context
      )
      const row = Array.isArray(created) ? created[0] : created
      return this.toNoteRecord(row as MercflowOrderNoteRecord)
    })
  }

  async deleteOrderNote(
    storeId: string,
    orderId: string,
    noteId: string
  ): Promise<void> {
    await this.withTenant(storeId, async (context) => {
      const rows = await this.listMercflowOrderNotes(
        {
          id: noteId,
          store_id: storeId,
          order_id: orderId,
        },
        {},
        context
      )
      const existing = rows[0] as MercflowOrderNoteRecord | undefined
      if (!existing) {
        throw new MedusaError(
          MedusaError.Types.NOT_FOUND,
          `Order note "${noteId}" not found for order "${orderId}"`
        )
      }
      await this.softDeleteMercflowOrderNotes(existing.id)
    })
  }

  // --- Suppliers (S006 T021) ---

  async listSuppliers(
    storeId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<{ suppliers: MercflowSupplierRecord[]; count: number }> {
    return this.withTenant(storeId, async (context) => {
      const [rows, count] = await this.listAndCountMercflowSuppliers(
        { store_id: storeId },
        {
          order: { name: "ASC" },
          skip: options?.offset ?? 0,
          take: options?.limit ?? 50,
        },
        context
      )
      return {
        suppliers: rows.map((row) => this.toSupplierRecord(row as MercflowSupplierRecord)),
        count,
      }
    })
  }

  async retrieveSupplier(
    storeId: string,
    supplierId: string
  ): Promise<MercflowSupplierRecord | null> {
    return this.withTenant(storeId, async (context) => {
      const rows = await this.listMercflowSuppliers(
        { id: supplierId, store_id: storeId },
        {},
        context
      )
      const row = rows[0] as MercflowSupplierRecord | undefined
      return row ? this.toSupplierRecord(row) : null
    })
  }

  async createSupplier(
    storeId: string,
    input: CreateSupplierInput
  ): Promise<MercflowSupplierRecord> {
    const name = input.name.trim()
    if (name === "") {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Supplier name is required")
    }

    return this.withTenant(storeId, async (context) => {
      const created = await this.createMercflowSuppliers(
        {
          store_id: storeId,
          name,
          contact_person: normalizeOptionalText(input.contact_person),
          email: normalizeOptionalText(input.email),
          country: normalizeOptionalText(input.country),
          currency: normalizeOptionalText(input.currency),
        },
        context
      )
      const row = Array.isArray(created) ? created[0] : created
      return this.toSupplierRecord(row as MercflowSupplierRecord)
    })
  }

  async updateSupplier(
    storeId: string,
    supplierId: string,
    input: UpdateSupplierInput
  ): Promise<MercflowSupplierRecord> {
    return this.withTenant(storeId, async (context) => {
      const existingRows = await this.listMercflowSuppliers(
        { id: supplierId, store_id: storeId },
        {},
        context
      )
      if (!existingRows[0]) {
        throw new MedusaError(
          MedusaError.Types.NOT_FOUND,
          `Supplier "${supplierId}" not found`
        )
      }

      const payload: Record<string, unknown> = {}
      if (input.name !== undefined) {
        const name = input.name.trim()
        if (name === "") {
          throw new MedusaError(MedusaError.Types.INVALID_DATA, "Supplier name is required")
        }
        payload.name = name
      }
      if (input.contact_person !== undefined) {
        payload.contact_person = normalizeOptionalText(input.contact_person)
      }
      if (input.email !== undefined) {
        payload.email = normalizeOptionalText(input.email)
      }
      if (input.country !== undefined) {
        payload.country = normalizeOptionalText(input.country)
      }
      if (input.currency !== undefined) {
        payload.currency = normalizeOptionalText(input.currency)
      }

      const updated = await this.updateMercflowSuppliers(
        { id: supplierId, store_id: storeId },
        payload,
        context
      )
      const row = Array.isArray(updated) ? updated[0] : updated
      return this.toSupplierRecord(row as MercflowSupplierRecord)
    })
  }

  async deleteSupplier(storeId: string, supplierId: string): Promise<void> {
    await this.withTenant(storeId, async (context) => {
      const existing = await this.listMercflowSuppliers(
        { id: supplierId, store_id: storeId },
        {},
        context
      )
      if (!existing[0]) {
        throw new MedusaError(
          MedusaError.Types.NOT_FOUND,
          `Supplier "${supplierId}" not found`
        )
      }
      await this.softDeleteMercflowSuppliers(supplierId)
    })
  }

  // --- Purchase orders (S006 T022) ---

  async listPurchaseOrders(
    storeId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<{ purchase_orders: MercflowPurchaseOrderRecord[]; count: number }> {
    return this.withTenant(storeId, async (context) => {
      const [rows, count] = await this.listAndCountMercflowPurchaseOrders(
        { store_id: storeId },
        {
          order: { created_at: "DESC" },
          skip: options?.offset ?? 0,
          take: options?.limit ?? 50,
        },
        context
      )
      return {
        purchase_orders: rows.map((row) =>
          this.toPurchaseOrderRecord(row as MercflowPurchaseOrderRecord)
        ),
        count,
      }
    })
  }

  async listPurchaseOrderLines(
    storeId: string,
    poId: string
  ): Promise<MercflowPurchaseOrderLineRecord[]> {
    return this.withTenant(storeId, async (context) => {
      const rows = await this.listMercflowPurchaseOrderLines(
        { store_id: storeId, po_id: poId },
        { order: { created_at: "ASC" } },
        context
      )
      return rows.map((row) =>
        this.toPurchaseOrderLineRecord(row as MercflowPurchaseOrderLineRecord)
      )
    })
  }

  async createPurchaseOrder(
    storeId: string,
    input: CreatePurchaseOrderInput
  ): Promise<{ purchase_order: MercflowPurchaseOrderRecord; lines: MercflowPurchaseOrderLineRecord[] }> {
    const supplier = await this.retrieveSupplier(storeId, input.supplier_id)
    if (!supplier) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Supplier "${input.supplier_id}" not found`
      )
    }

    return this.withTenant(storeId, async (context) => {
      const createdPo = await this.createMercflowPurchaseOrders(
        {
          store_id: storeId,
          supplier_id: input.supplier_id,
          status: "draft",
          expected_date: parseExpectedDate(input.expected_date ?? null),
          reference: normalizeOptionalText(input.reference),
          notes: normalizeOptionalText(input.notes),
        },
        context
      )
      const poRow = Array.isArray(createdPo) ? createdPo[0] : createdPo
      const po = this.toPurchaseOrderRecord(poRow as MercflowPurchaseOrderRecord)

      const lines: MercflowPurchaseOrderLineRecord[] = []
      for (const line of input.lines) {
        const createdLine = await this.createMercflowPurchaseOrderLines(
          {
            store_id: storeId,
            po_id: po.id,
            variant_id: line.variant_id,
            ordered_qty: line.ordered_qty,
            unit_cost: line.unit_cost,
          },
          context
        )
        const lineRow = Array.isArray(createdLine) ? createdLine[0] : createdLine
        lines.push(
          this.toPurchaseOrderLineRecord(lineRow as MercflowPurchaseOrderLineRecord)
        )
      }

      return { purchase_order: po, lines }
    })
  }

  async retrievePurchaseOrder(
    storeId: string,
    poId: string
  ): Promise<PurchaseOrderDetail> {
    return this.withTenant(storeId, async (context) => {
      const po = await this.requirePurchaseOrderRow(storeId, poId, context)
      const lines = await this.listMercflowPurchaseOrderLines(
        { store_id: storeId, po_id: poId },
        { order: { created_at: "ASC" } },
        context
      )
      const lineRecords = lines.map((row) =>
        this.toPurchaseOrderLineRecord(row as MercflowPurchaseOrderLineRecord)
      )
      const summaries = await this.buildLineSummaries(
        storeId,
        lineRecords,
        context
      )
      return {
        purchase_order: this.toPurchaseOrderRecord(po),
        lines: summaries,
        stock_applied: false,
      }
    })
  }

  async receivePurchaseOrder(
    storeId: string,
    poId: string,
    input: ReceivePurchaseOrderInput
  ): Promise<PurchaseOrderDetail> {
    if (input.lines.length === 0) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "At least one receipt line is required"
      )
    }

    return this.withTenant(storeId, async (context) => {
      const poRow = await this.requirePurchaseOrderRow(storeId, poId, context)
      const po = this.toPurchaseOrderRecord(poRow)
      if (!RECEIVABLE_PO_STATUSES.includes(po.status)) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Cannot receive purchase order in status "${po.status}"`
        )
      }

      const existingLines = await this.listMercflowPurchaseOrderLines(
        { store_id: storeId, po_id: poId },
        {},
        context
      )
      const lineById = new Map(
        existingLines.map((row) => [
          (row as MercflowPurchaseOrderLineRecord).id,
          this.toPurchaseOrderLineRecord(row as MercflowPurchaseOrderLineRecord),
        ])
      )

      const seenLineIds = new Set<string>()
      for (const entry of input.lines) {
        if (seenLineIds.has(entry.line_id)) {
          throw new MedusaError(
            MedusaError.Types.INVALID_DATA,
            `Duplicate line_id "${entry.line_id}" in receive payload`
          )
        }
        seenLineIds.add(entry.line_id)
        if (!lineById.has(entry.line_id)) {
          throw new MedusaError(
            MedusaError.Types.NOT_FOUND,
            `Purchase order line "${entry.line_id}" not found on PO "${poId}"`
          )
        }
        assertPositiveReceivedQty(entry.received_qty)
      }

      const receivedAt = new Date()
      for (const entry of input.lines) {
        await this.createMercflowPurchaseOrderReceipts(
          {
            store_id: storeId,
            line_id: entry.line_id,
            received_qty: entry.received_qty,
            received_at: receivedAt,
            notes: normalizeOptionalText(entry.notes),
          },
          context
        )
      }

      const lineRecords = [...lineById.values()]
      const summaries = await this.buildLineSummaries(
        storeId,
        lineRecords,
        context
      )
      const nextStatus = deriveReceiveStatus(summaries)
      const updatedRows = await this.updateMercflowPurchaseOrders(
        { id: poId, store_id: storeId },
        { status: nextStatus },
        context
      )
      const updatedRow = Array.isArray(updatedRows) ? updatedRows[0] : updatedRows

      return {
        purchase_order: this.toPurchaseOrderRecord(
          updatedRow as MercflowPurchaseOrderRecord
        ),
        lines: summaries,
        stock_applied: false,
      }
    })
  }

  async updatePurchaseOrderStatus(
    storeId: string,
    poId: string,
    nextStatus: PurchaseOrderStatus
  ): Promise<MercflowPurchaseOrderRecord> {
    if (!PURCHASE_ORDER_STATUSES.includes(nextStatus)) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Invalid purchase order status")
    }

    return this.withTenant(storeId, async (context) => {
      const rows = await this.listMercflowPurchaseOrders(
        { id: poId, store_id: storeId },
        {},
        context
      )
      const existing = rows[0] as MercflowPurchaseOrderRecord | undefined
      if (!existing) {
        throw new MedusaError(
          MedusaError.Types.NOT_FOUND,
          `Purchase order "${poId}" not found`
        )
      }

      const current = this.toPurchaseOrderRecord(existing).status
      const allowed = PO_STATUS_TRANSITIONS[current]
      if (!allowed?.includes(nextStatus)) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Cannot transition purchase order from "${current}" to "${nextStatus}"`
        )
      }

      const updated = await this.updateMercflowPurchaseOrders(
        { id: poId, store_id: storeId },
        { status: nextStatus },
        context
      )
      const row = Array.isArray(updated) ? updated[0] : updated
      return this.toPurchaseOrderRecord(row as MercflowPurchaseOrderRecord)
    })
  }

  // --- Inventory config skeleton (S006 T020) ---

  private async requirePurchaseOrderRow(
    storeId: string,
    poId: string,
    context: Context
  ): Promise<MercflowPurchaseOrderRecord> {
    const rows = await this.listMercflowPurchaseOrders(
      { id: poId, store_id: storeId },
      {},
      context
    )
    const existing = rows[0] as MercflowPurchaseOrderRecord | undefined
    if (!existing) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Purchase order "${poId}" not found`
      )
    }
    return existing
  }

  private async buildLineSummaries(
    storeId: string,
    lines: MercflowPurchaseOrderLineRecord[],
    context: Context
  ): Promise<PurchaseOrderLineSummary[]> {
    if (lines.length === 0) {
      return []
    }
    const lineIds = lines.map((line) => line.id)
    const receiptRows = await this.listMercflowPurchaseOrderReceipts(
      { store_id: storeId, line_id: lineIds },
      { order: { received_at: "ASC" } },
      context
    )
    const receiptsByLine = new Map<string, MercflowPurchaseOrderReceiptRecord[]>()
    for (const raw of receiptRows) {
      const receipt = this.toReceiptRecord(raw as MercflowPurchaseOrderReceiptRecord)
      const bucket = receiptsByLine.get(receipt.line_id) ?? []
      bucket.push(receipt)
      receiptsByLine.set(receipt.line_id, bucket)
    }

    return lines.map((line) => {
      const received_total = sumReceiptQty(receiptsByLine.get(line.id) ?? [])
      return {
        ...line,
        received_total,
        discrepancy: line.ordered_qty - received_total,
      }
    })
  }

  async getInventoryConfig(storeId: string): Promise<MercflowInventoryConfigRecord | null> {
    return this.withTenant(storeId, async (context) => {
      const rows = await this.listMercflowInventoryConfigs(
        { store_id: storeId },
        {},
        context
      )
      const row = rows[0] as MercflowInventoryConfigRecord | undefined
      return row ? this.toInventoryConfigRecord(row) : null
    })
  }

  async upsertInventoryConfig(
    storeId: string,
    input: UpsertInventoryConfigInput
  ): Promise<MercflowInventoryConfigRecord> {
    return this.withTenant(storeId, async (context) => {
      const rows = await this.listMercflowInventoryConfigs(
        { store_id: storeId },
        {},
        context
      )
      const existing = rows[0] as MercflowInventoryConfigRecord | undefined
      if (!existing) {
        const created = await this.createMercflowInventoryConfigs(
          {
            store_id: storeId,
            low_stock_threshold: input.low_stock_threshold ?? 5,
            email_alerts_enabled: input.email_alerts_enabled ?? false,
          },
          context
        )
        const row = Array.isArray(created) ? created[0] : created
        return this.toInventoryConfigRecord(row as MercflowInventoryConfigRecord)
      }

      const payload: Record<string, unknown> = {}
      if (input.low_stock_threshold !== undefined) {
        if (!Number.isInteger(input.low_stock_threshold) || input.low_stock_threshold < 0) {
          throw new MedusaError(
            MedusaError.Types.INVALID_DATA,
            "low_stock_threshold must be a non-negative integer"
          )
        }
        payload.low_stock_threshold = input.low_stock_threshold
      }
      if (input.email_alerts_enabled !== undefined) {
        payload.email_alerts_enabled = input.email_alerts_enabled
      }

      const updated = await this.updateMercflowInventoryConfigs(
        { id: existing.id, store_id: storeId },
        payload,
        context
      )
      const row = Array.isArray(updated) ? updated[0] : updated
      return this.toInventoryConfigRecord(row as MercflowInventoryConfigRecord)
    })
  }

  async listIncomingQtyByVariant(storeId: string): Promise<Map<string, number>> {
    const openStatuses: PurchaseOrderStatus[] = ["ordered", "partially_received"]
    const incoming = new Map<string, number>()

    return this.withTenant(storeId, async (context) => {
      const orders = await this.listMercflowPurchaseOrders(
        { store_id: storeId },
        {},
        context
      )

      for (const rawPo of orders) {
        const po = this.toPurchaseOrderRecord(rawPo as MercflowPurchaseOrderRecord)
        if (!openStatuses.includes(po.status)) {
          continue
        }
        const lines = await this.listMercflowPurchaseOrderLines(
          { store_id: storeId, po_id: po.id },
          {},
          context
        )
        const lineRecords = lines.map((row) =>
          this.toPurchaseOrderLineRecord(row as MercflowPurchaseOrderLineRecord)
        )
        const summaries = await this.buildLineSummaries(storeId, lineRecords, context)
        for (const line of summaries) {
          const delta = computeIncomingForLine(line.ordered_qty, line.received_total)
          if (delta <= 0) {
            continue
          }
          incoming.set(line.variant_id, (incoming.get(line.variant_id) ?? 0) + delta)
        }
      }

      return incoming
    })
  }

  async listVariantMovements(
    storeId: string,
    variantId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<{ movements: InventoryMovementRow[]; count: number }> {
    return this.withTenant(storeId, async (context) => {
      const lines = await this.listMercflowPurchaseOrderLines(
        { store_id: storeId, variant_id: variantId },
        {},
        context
      )
      if (lines.length === 0) {
        return { movements: [], count: 0 }
      }

      const lineIds = lines.map((row) => (row as MercflowPurchaseOrderLineRecord).id)
      const receipts = await this.listMercflowPurchaseOrderReceipts(
        { store_id: storeId, line_id: lineIds },
        { order: { received_at: "DESC" } },
        context
      )

      const lineById = new Map(
        lines.map((row) => {
          const line = this.toPurchaseOrderLineRecord(row as MercflowPurchaseOrderLineRecord)
          return [line.id, line] as const
        })
      )

      const movements: InventoryMovementRow[] = []
      for (const raw of receipts) {
        const receipt = this.toReceiptRecord(raw as MercflowPurchaseOrderReceiptRecord)
        const line = lineById.get(receipt.line_id)
        if (!line) {
          continue
        }
        const receivedAt =
          receipt.received_at instanceof Date
            ? receipt.received_at.toISOString()
            : String(receipt.received_at)
        movements.push({
          id: receipt.id,
          occurred_at: receivedAt,
          quantity: receipt.received_qty,
          source: "po_receipt",
          label: `PO line ${line.po_id}`,
        })
      }

      const offset = options?.offset ?? 0
      const limit = options?.limit ?? 50
      return {
        movements: movements.slice(offset, offset + limit),
        count: movements.length,
      }
    })
  }

  private toNoteRecord(row: MercflowOrderNoteRecord): MercflowOrderNoteRecord {
    return {
      id: row.id,
      store_id: row.store_id,
      order_id: row.order_id,
      content: row.content,
      created_by: row.created_by,
      created_at: row.created_at,
      updated_at: row.updated_at,
      deleted_at: row.deleted_at ?? null,
    }
  }

  private toSupplierRecord(row: MercflowSupplierRecord): MercflowSupplierRecord {
    return {
      id: row.id,
      store_id: row.store_id,
      name: row.name,
      contact_person: row.contact_person ?? null,
      email: row.email ?? null,
      country: row.country ?? null,
      currency: row.currency ?? null,
      created_at: row.created_at,
      updated_at: row.updated_at,
      deleted_at: row.deleted_at ?? null,
    }
  }

  private toPurchaseOrderRecord(
    row: MercflowPurchaseOrderRecord
  ): MercflowPurchaseOrderRecord {
    const status = row.status as PurchaseOrderStatus
    if (!PURCHASE_ORDER_STATUSES.includes(status)) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Purchase order "${row.id}" has invalid status "${row.status}"`
      )
    }
    return {
      id: row.id,
      store_id: row.store_id,
      supplier_id: row.supplier_id,
      status,
      expected_date: row.expected_date ?? null,
      reference: row.reference ?? null,
      notes: row.notes ?? null,
      created_at: row.created_at,
      updated_at: row.updated_at,
      deleted_at: row.deleted_at ?? null,
    }
  }

  private toReceiptRecord(
    row: MercflowPurchaseOrderReceiptRecord
  ): MercflowPurchaseOrderReceiptRecord {
    return {
      id: row.id,
      store_id: row.store_id,
      line_id: row.line_id,
      received_qty: Number(row.received_qty),
      received_at: row.received_at,
      notes: row.notes ?? null,
    }
  }

  private toPurchaseOrderLineRecord(
    row: MercflowPurchaseOrderLineRecord
  ): MercflowPurchaseOrderLineRecord {
    return {
      id: row.id,
      store_id: row.store_id,
      po_id: row.po_id,
      variant_id: row.variant_id,
      ordered_qty: Number(row.ordered_qty),
      unit_cost: Number(row.unit_cost),
      created_at: row.created_at,
      updated_at: row.updated_at,
    }
  }

  private toInventoryConfigRecord(
    row: MercflowInventoryConfigRecord
  ): MercflowInventoryConfigRecord {
    return {
      id: row.id,
      store_id: row.store_id,
      low_stock_threshold: Number(row.low_stock_threshold),
      email_alerts_enabled: Boolean(row.email_alerts_enabled),
      created_at: row.created_at,
      updated_at: row.updated_at,
      deleted_at: row.deleted_at ?? null,
    }
  }
}

export default InventoryModuleService
