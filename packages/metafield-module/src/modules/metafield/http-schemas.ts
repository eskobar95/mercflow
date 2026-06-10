import { z } from "zod"

import { METAFIELD_LIBRARY_VERTICALS } from "./standard-library-seeds"
import { METAFIELD_OWNER_TYPES, VALUE_TYPES } from "./types"

export const metafieldDefinitionsListQuerySchema = z.object({
  owner_type: z.enum(METAFIELD_OWNER_TYPES),
  category_id: z.string().trim().min(1).optional(),
  limit: z.coerce.number().int().min(1).optional(),
  offset: z.coerce.number().int().min(0).optional(),
  store_id: z.string().trim().min(1).optional(),
})

export const metafieldDefinitionPostBodySchema = z.object({
  owner_type: z.enum(METAFIELD_OWNER_TYPES),
  namespace: z.string().trim().min(1),
  key: z.string().trim().min(1),
  name: z.string().trim().min(1),
  description: z.string().nullable().optional(),
  type: z.enum(VALUE_TYPES),
  validations: z.record(z.string(), z.unknown()).nullable().optional(),
  pinned_position: z.number().int().nullable().optional(),
  is_required: z.boolean().optional(),
  is_primary: z.boolean().optional(),
  category_constraint_id: z.string().nullable().optional(),
})

export const metafieldDefinitionPutBodySchema = z.object({
  name: z.string().trim().min(1).optional(),
  description: z.string().nullable().optional(),
  type: z.enum(VALUE_TYPES).optional(),
  validations: z.record(z.string(), z.unknown()).nullable().optional(),
  pinned_position: z.number().int().nullable().optional(),
  is_required: z.boolean().optional(),
  is_primary: z.boolean().optional(),
  category_constraint_id: z.string().nullable().optional(),
})

export const metafieldValuesListQuerySchema = z.object({
  owner_type: z.enum(METAFIELD_OWNER_TYPES),
  owner_id: z.string().trim().min(1),
  locale: z.string().trim().min(1).optional(),
  store_id: z.string().trim().min(1).optional(),
})

export const metafieldStoreListQuerySchema = z.object({
  owner_type: z.enum(METAFIELD_OWNER_TYPES),
  owner_id: z.string().trim().min(1),
  locale: z.string().trim().min(1).optional(),
})

export const metafieldValueUpsertItemSchema = z.object({
  definition_id: z.string().trim().min(1),
  owner_id: z.string().trim().min(1),
  owner_type: z.enum(METAFIELD_OWNER_TYPES),
  locale: z.string().trim().min(1).optional(),
  value: z.unknown(),
})

export const metafieldValuesBatchBodySchema = z.object({
  values: z.array(metafieldValueUpsertItemSchema).min(1).max(50),
})

export const createDefinitionBodySchema = metafieldDefinitionPostBodySchema

export const metafieldStandardLibraryQuerySchema = z.object({
  vertical: z.enum(METAFIELD_LIBRARY_VERTICALS),
  owner_type: z.enum(METAFIELD_OWNER_TYPES).optional(),
  limit: z.coerce.number().int().min(1).optional(),
  offset: z.coerce.number().int().min(0).optional(),
  store_id: z.string().trim().min(1).optional(),
})

export const metafieldActivateStandardBodySchema = z.object({
  vertical: z.enum(METAFIELD_LIBRARY_VERTICALS),
  definition_ids: z.array(z.string().trim().min(1)).min(1).optional(),
  store_id: z.string().trim().min(1).optional(),
})
