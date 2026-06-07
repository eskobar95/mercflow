import type { ReactNode } from "react"
import { Link } from "react-router-dom"

import { PageEditForm } from "./PageEditForm"
import { usePageEditPage } from "./usePageEditPage"

export function PageEditPage(): ReactNode {
  const { isNew, state, dispatch, onTitleChange, onSlugChange, onSave, onDelete } = usePageEditPage()
  const { loadError } = state

  if (loadError) {
    return (
      <div className="p-6">
        <div
          role="alert"
          className="rounded-md border border-border-default bg-surface-raised p-4 text-sm text-content-secondary"
        >
          <p className="font-medium text-content-primary">Could not open page</p>
          <p className="mt-2">{loadError}</p>
          <Link
            to="/content/pages"
            className="mt-3 inline-block text-sm font-medium text-interactive-primary hover:text-interactive-primary-hover"
          >
            Back to pages
          </Link>
        </div>
      </div>
    )
  }

  return (
    <PageEditForm
      isNew={isNew}
      title={state.title}
      slug={state.slug}
      pageType={state.pageType}
      status={state.status}
      blockCount={state.blockCount}
      saveError={state.saveError}
      isLoading={state.isLoading}
      isSaving={state.isSaving}
      dispatch={dispatch}
      onTitleChange={onTitleChange}
      onSlugChange={onSlugChange}
      onSave={onSave}
      onDelete={onDelete}
    />
  )
}
