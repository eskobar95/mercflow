import type { ArticleRecord } from "../../modules/content/types"

export function articleRecordToAdminJson(row: ArticleRecord): Record<string, unknown> {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    body_json: row.body_json,
    locale: row.locale,
    status: row.status,
    published_at: row.published_at ? row.published_at.toISOString() : null,
    created_at: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    updated_at: row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at,
  }
}

export function articleRecordToStoreListJson(row: ArticleRecord): Record<string, unknown> {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    published_at: row.published_at ? row.published_at.toISOString() : null,
    locale: row.locale,
  }
}

export function articleRecordToStoreDetailJson(row: ArticleRecord): Record<string, unknown> {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    body_json: row.body_json,
    locale: row.locale,
    published_at: row.published_at ? row.published_at.toISOString() : null,
  }
}
