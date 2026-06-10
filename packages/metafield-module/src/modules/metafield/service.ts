import type { Context } from "@medusajs/types"
import { MedusaService } from "@medusajs/framework/utils"
import { MedusaError } from "@medusajs/utils"

import { MetafieldDefinition, MetafieldValue } from "./models"
import type {
  CreateDefinitionInput,
  ListDefinitionsFilters,
  MetafieldDefinitionRecord,
  MetafieldOwnerType,
  MetafieldValueListItem,
  MetafieldValueRecord,
  StoredValueColumns,
  UpdateDefinitionInput,
  UpsertValueInput,
  ValueType,
} from "./types"
import { runWithTenantScope } from "./tenant-scope"
import { buildStoredColumns, extractTypedValue } from "./value-columns"

const DEFAULT_LOCALE = "en"
const BATCH_UPSERT_MAX = 50

function normalizeLocale(locale: string | undefined): string {
  const resolved = locale?.trim() ?? DEFAULT_LOCALE
  if (resolved === "") {
    return DEFAULT_LOCALE
  }
  return resolved
}

function toDefinitionRecord(row: Record<string, unknown>): MetafieldDefinitionRecord {
  return row as unknown as MetafieldDefinitionRecord
}

function toValueRecord(row: Record<string, unknown>): MetafieldValueRecord {
  return row as unknown as MetafieldValueRecord
}

function unwrapCreated<T>(result: T | T[]): T {
  return Array.isArray(result) ? result[0]! : result
}

function isDuplicateKeyError(error: unknown): boolean {
  return error instanceof Error && error.message.toLowerCase().includes("duplicate key")
}

function toJsonColumnValue(
  stored: StoredValueColumns
): Record<string, unknown> | null {
  if (stored.value_json === null) {
    return null
  }
  if (Array.isArray(stored.value_json)) {
    return { __items: stored.value_json }
  }
  return stored.value_json
}

function fromJsonColumnValue(
  value: Record<string, unknown> | null,
  type: ValueType
): Record<string, unknown> | unknown[] | null {
  if (value === null) {
    return null
  }
  if (
    (type === "list.single_line_text" || type === "list.number_integer") &&
    Array.isArray(value.__items)
  ) {
    return value.__items
  }
  return value
}

class MetafieldModuleService extends MedusaService({
  MetafieldDefinition,
  MetafieldValue,
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

  async createDefinition(
    storeId: string,
    input: CreateDefinitionInput
  ): Promise<MetafieldDefinitionRecord> {
    return this.withTenant(storeId, async (context) => {
      try {
        const created = await this.createMetafieldDefinitions(
          {
            store_id: storeId,
            owner_type: input.owner_type,
            namespace: input.namespace.trim(),
            key: input.key.trim(),
            name: input.name.trim(),
            description: input.description ?? null,
            type: input.type,
            validations: input.validations ?? null,
            pinned_position: input.pinned_position ?? null,
            is_required: input.is_required ?? false,
            is_primary: input.is_primary ?? false,
            category_constraint_id: input.category_constraint_id ?? null,
            is_standard: false,
          },
          context
        )
        return toDefinitionRecord(unwrapCreated(created) as Record<string, unknown>)
      } catch (error: unknown) {
        if (isDuplicateKeyError(error)) {
          throw new MedusaError(
            MedusaError.Types.DUPLICATE_ERROR,
            `Metafield definition already exists for namespace/key (${input.namespace}/${input.key})`
          )
        }
        throw error
      }
    })
  }

  async getDefinition(storeId: string, definitionId: string): Promise<MetafieldDefinitionRecord> {
    const row = await this.getDefinitionForStore(storeId, definitionId)
    if (!row) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Metafield definition ${definitionId} not found for store ${storeId}`
      )
    }
    return row
  }

  async updateDefinition(
    storeId: string,
    definitionId: string,
    input: UpdateDefinitionInput
  ): Promise<MetafieldDefinitionRecord> {
    return this.withTenant(storeId, async (context) => {
      const existing = await this.getDefinitionForStore(storeId, definitionId, context)
      if (!existing) {
        throw new MedusaError(
          MedusaError.Types.NOT_FOUND,
          `Metafield definition ${definitionId} not found for store ${storeId}`
        )
      }
      const updated = await this.updateMetafieldDefinitions(
        {
          id: definitionId,
          ...(input.name !== undefined ? { name: input.name.trim() } : {}),
          ...(input.description !== undefined ? { description: input.description } : {}),
          ...(input.type !== undefined ? { type: input.type } : {}),
          ...(input.validations !== undefined ? { validations: input.validations } : {}),
          ...(input.pinned_position !== undefined ? { pinned_position: input.pinned_position } : {}),
          ...(input.is_required !== undefined ? { is_required: input.is_required } : {}),
          ...(input.is_primary !== undefined ? { is_primary: input.is_primary } : {}),
          ...(input.category_constraint_id !== undefined
            ? { category_constraint_id: input.category_constraint_id }
            : {}),
        },
        context
      )
      return toDefinitionRecord(unwrapCreated(updated) as Record<string, unknown>)
    })
  }

  async deleteDefinition(storeId: string, definitionId: string): Promise<void> {
    await this.withTenant(storeId, async (context) => {
      const existing = await this.getDefinitionForStore(storeId, definitionId, context)
      if (!existing) {
        throw new MedusaError(
          MedusaError.Types.NOT_FOUND,
          `Metafield definition ${definitionId} not found for store ${storeId}`
        )
      }
      await this.deleteMetafieldDefinitions(definitionId, context)
    })
  }

  async listDefinitions(
    filters: ListDefinitionsFilters
  ): Promise<{ definitions: MetafieldDefinitionRecord[]; count: number }> {
    if (
      filters.categoryConstraintIds !== undefined &&
      filters.categoryConstraintIds.length === 0
    ) {
      return { definitions: [], count: 0 }
    }

    return this.withTenant(filters.storeId, async (context) => {
      const query: Record<string, unknown> = {
        store_id: filters.storeId,
        owner_type: filters.ownerType,
      }
      if (filters.categoryConstraintIds !== undefined) {
        query.category_constraint_id = { $in: filters.categoryConstraintIds }
      }

      const [rows, count] = await this.listAndCountMetafieldDefinitions(
        query,
        {
          order: { name: "ASC" },
          skip: filters.offset ?? 0,
          take: filters.limit ?? 50,
        },
        context
      )

      return {
        definitions: rows.map((row) => toDefinitionRecord(row as Record<string, unknown>)),
        count,
      }
    })
  }

  async getDefinitionForStore(
    storeId: string,
    definitionId: string,
    context?: Context
  ): Promise<MetafieldDefinitionRecord | null> {
    const run = async (ctx: Context): Promise<MetafieldDefinitionRecord | null> => {
      const rows = await this.listMetafieldDefinitions(
        {
          id: definitionId,
          store_id: storeId,
        },
        { take: 1 },
        ctx
      )
      const row = rows[0]
      return row ? toDefinitionRecord(row as Record<string, unknown>) : null
    }

    if (context) {
      return run(context)
    }
    return this.withTenant(storeId, run)
  }

  async upsertValue(
    storeId: string,
    input: UpsertValueInput,
    context?: Context
  ): Promise<MetafieldValueRecord> {
    const run = async (ctx: Context): Promise<MetafieldValueRecord> => {
      const definition = await this.getDefinitionForStore(storeId, input.definition_id, ctx)
      if (!definition) {
        throw new MedusaError(
          MedusaError.Types.NOT_FOUND,
          `Metafield definition ${input.definition_id} not found for store ${storeId}`
        )
      }

      if (definition.owner_type !== input.owner_type) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "owner_type does not match the definition owner_type"
        )
      }

      const locale = normalizeLocale(input.locale)
      const stored = buildStoredColumns(definition.type as ValueType, input.value)
      const payload = {
        value_text: stored.value_text,
        value_json: toJsonColumnValue(stored),
        value_number: stored.value_number,
        value_boolean: stored.value_boolean,
      }

      const existing = await this.listMetafieldValues(
        {
          store_id: storeId,
          definition_id: input.definition_id,
          owner_id: input.owner_id,
          locale,
        },
        { take: 1 },
        ctx
      )

      if (existing[0]) {
        const current = existing[0] as Record<string, unknown>
        const updated = await this.updateMetafieldValues(
          {
            id: current.id as string,
            ...payload,
          },
          ctx
        )
        return toValueRecord(unwrapCreated(updated) as Record<string, unknown>)
      }

      const created = await this.createMetafieldValues(
        {
          store_id: storeId,
          definition_id: input.definition_id,
          owner_id: input.owner_id,
          owner_type: input.owner_type,
          locale,
          ...payload,
        },
        ctx
      )
      return toValueRecord(unwrapCreated(created) as Record<string, unknown>)
    }

    if (context) {
      return run(context)
    }
    return this.withTenant(storeId, run)
  }

  async batchUpsertValues(
    storeId: string,
    inputs: UpsertValueInput[]
  ): Promise<MetafieldValueRecord[]> {
    if (inputs.length === 0) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "values array cannot be empty")
    }
    if (inputs.length > BATCH_UPSERT_MAX) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Batch upsert supports at most ${BATCH_UPSERT_MAX} values per request`
      )
    }

    return this.withTenant(storeId, async (context) => {
      const results: MetafieldValueRecord[] = []
      for (const input of inputs) {
        const row = await this.upsertValue(storeId, input, context)
        results.push(row)
      }
      return results
    })
  }

  async deleteValue(storeId: string, valueId: string): Promise<void> {
    await this.withTenant(storeId, async (context) => {
      const rows = await this.listMetafieldValues(
        { id: valueId, store_id: storeId },
        { take: 1 },
        context
      )
      if (!rows[0]) {
        throw new MedusaError(
          MedusaError.Types.NOT_FOUND,
          `Metafield value ${valueId} not found for store ${storeId}`
        )
      }
      await this.deleteMetafieldValues(valueId, context)
    })
  }

  async listValues(
    storeId: string,
    filters: {
      ownerType: MetafieldOwnerType
      ownerId: string
      locale?: string
    }
  ): Promise<MetafieldValueListItem[]> {
    return this.withTenant(storeId, async (context) => {
      const valueFilters: Record<string, unknown> = {
        store_id: storeId,
        owner_type: filters.ownerType,
        owner_id: filters.ownerId,
      }
      if (filters.locale !== undefined && filters.locale.trim() !== "") {
        valueFilters.locale = filters.locale.trim()
      }

      const valueRows = await this.listMetafieldValues(valueFilters, {}, context)
      if (valueRows.length === 0) {
        return []
      }

      const definitionIds = [
        ...new Set(valueRows.map((row) => (row as { definition_id: string }).definition_id)),
      ]
      const definitions = await this.listMetafieldDefinitions(
        {
          id: { $in: definitionIds },
          store_id: storeId,
        },
        { take: definitionIds.length },
        context
      )
      const definitionById = new Map(
        definitions.map((row) => {
          const record = toDefinitionRecord(row as Record<string, unknown>)
          return [record.id, record] as const
        })
      )

      return valueRows.flatMap((row) => {
        const valueRecord = toValueRecord(row as Record<string, unknown>)
        const definition = definitionById.get(valueRecord.definition_id)
        if (!definition) {
          return []
        }
        const storedForExtract: StoredValueColumns = {
          value_text: valueRecord.value_text,
          value_json: fromJsonColumnValue(valueRecord.value_json, definition.type),
          value_number: valueRecord.value_number,
          value_boolean: valueRecord.value_boolean,
        }
        return [
          {
            id: valueRecord.id,
            namespace: definition.namespace,
            key: definition.key,
            name: definition.name,
            type: definition.type,
            value: extractTypedValue(storedForExtract, definition.type),
            locale: valueRecord.locale,
          },
        ]
      })
    })
  }
}

export default MetafieldModuleService
