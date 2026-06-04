export type RobotsRule = {
  user_agent: string
  allow: string[]
  disallow: string[]
}

export type RobotsStructuredConfig = {
  rules: RobotsRule[]
}

export type RobotsChangeHistoryEntry = {
  changed_at: string
  summary: string
}

export type MercflowRobotsConfigRecord = {
  id: string
  store_id: string
  structured_rules: RobotsStructuredConfig
  freetext_override: string | null
  change_history: RobotsChangeHistoryEntry[]
  created_at: Date
  updated_at: Date
  deleted_at: Date | null
}

export type UpsertRobotsConfigInput = {
  structured_rules?: RobotsStructuredConfig
  freetext_override?: string | null
  change_summary?: string
}
