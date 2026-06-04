export type ArticleStatus = "draft" | "published"

export type ArticleAdminRecord = {
  id: string
  slug: string
  title: string
  body_json: unknown
  locale: string
  status: ArticleStatus
  published_at: string | null
  created_at?: string
  updated_at?: string
}
