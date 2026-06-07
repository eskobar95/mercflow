import type { Dispatch, ReactNode } from "react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import type { CmsPageStatus, CmsPageType } from "@/features/cms-pages/cmsPagesAdminApi"

import { PAGE_TYPES, type PageEditAction } from "./pageEditState"

type PageEditFormProps = {
  isNew: boolean
  title: string
  slug: string
  pageType: CmsPageType
  status: CmsPageStatus
  blockCount: number | null
  saveError: string | null
  isLoading: boolean
  isSaving: boolean
  dispatch: Dispatch<PageEditAction>
  onTitleChange: (value: string) => void
  onSlugChange: (value: string) => void
  onSave: () => void
  onDelete: () => void
}

export function PageEditForm({
  isNew,
  title,
  slug,
  pageType,
  status,
  blockCount,
  saveError,
  isLoading,
  isSaving,
  dispatch,
  onTitleChange,
  onSlugChange,
  onSave,
  onDelete,
}: PageEditFormProps): ReactNode {
  return (
    <div className="p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-content-primary">
            {isNew ? "New page" : "Edit page"}
          </h1>
          <p className="mt-1 text-sm text-content-secondary">
            Slug changes create an automatic redirect for the old public URL.
          </p>
        </div>
        <Link
          to="/content/pages"
          className="text-sm font-medium text-interactive-primary hover:text-interactive-primary-hover"
        >
          Back to list
        </Link>
      </div>

      <div className="max-w-xl space-y-6 rounded-lg border border-border-default bg-surface-default p-6 shadow-sm">
        {saveError ? (
          <div
            role="alert"
            className="rounded-md border border-border-default bg-surface-raised p-3 text-sm text-content-secondary"
          >
            {saveError}
          </div>
        ) : null}

        {isLoading ? (
          <p className="text-sm text-content-secondary">Loading…</p>
        ) : (
          <>
            <div className="space-y-2">
              <label htmlFor="page-title" className="text-sm font-medium text-content-primary">
                Title
              </label>
              <Input
                id="page-title"
                value={title}
                onChange={(e) => {
                  onTitleChange(e.target.value)
                }}
                autoComplete="off"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="page-slug" className="text-sm font-medium text-content-primary">
                Slug
              </label>
              <Input
                id="page-slug"
                value={slug}
                onChange={(e) => {
                  onSlugChange(e.target.value)
                }}
                autoComplete="off"
              />
              <p className="text-xs text-content-tertiary">
                Lowercase letters, digits, and hyphens. Auto-filled from the title until you edit this field.
              </p>
            </div>

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-content-primary">Page type</legend>
              <div className="flex flex-col gap-2">
                {PAGE_TYPES.map((opt) => (
                  <label key={opt.value} className="flex items-center gap-2 text-sm text-content-secondary">
                    <input
                      type="radio"
                      name="page_type"
                      value={opt.value}
                      checked={pageType === opt.value}
                      onChange={() => {
                        dispatch({ type: "setPageType", value: opt.value })
                      }}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="space-y-2">
              <span className="text-sm font-medium text-content-primary">Status</span>
              <div className="flex flex-wrap gap-4 text-sm text-content-secondary">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="page_status"
                    value="draft"
                    checked={status === "draft"}
                    onChange={() => {
                      dispatch({ type: "setStatus", value: "draft" })
                    }}
                  />
                  Draft
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="page_status"
                    value="published"
                    checked={status === "published"}
                    onChange={() => {
                      dispatch({ type: "setStatus", value: "published" })
                    }}
                  />
                  Published
                </label>
              </div>
            </div>

            {!isNew ? (
              <div className="rounded-md border border-border-subtle bg-surface-subtle p-4">
                <p className="text-sm font-medium text-content-primary">Blocks</p>
                <p className="mt-1 text-sm text-content-secondary">
                  {blockCount === null ? "—" : `${blockCount} block${blockCount === 1 ? "" : "s"} on the latest version.`}
                </p>
                <div className="mt-3">
                  <Button type="button" variant="secondary" disabled>
                    Edit blocks
                  </Button>
                  <p className="mt-2 text-xs text-content-tertiary">
                    Visual block editing ships in a dedicated page-builder task.
                  </p>
                </div>
              </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-3">
              <Button type="button" onClick={onSave} disabled={isSaving}>
                {isSaving ? "Saving…" : "Save"}
              </Button>
              {!isNew ? (
                <Button type="button" variant="secondary" onClick={onDelete} disabled={isSaving}>
                  Delete
                </Button>
              ) : null}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
