import { useCallback, useEffect, useState } from "react"

import { Button } from "@/components/ui/Button"
import { Label } from "@/components/ui/Label"
import {
  createMercflowOrderNote,
  deleteMercflowOrderNote,
  fetchMercflowOrderNotes,
  type MercflowOrderNote,
} from "@/features/orders/orderNotesAdminApi"

export function OrderInternalNotesPanel(props: { orderId: string }): JSX.Element {
  const { orderId } = props
  const [notes, setNotes] = useState<MercflowOrderNote[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [draft, setDraft] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const load = useCallback(async (): Promise<void> => {
    setLoading(true)
    setErrorMessage(null)
    try {
      const rows = await fetchMercflowOrderNotes(orderId)
      setNotes(rows)
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load internal notes"
      setNotes([])
      setErrorMessage(msg)
    } finally {
      setLoading(false)
    }
  }, [orderId])

  useEffect(() => {
    void load()
  }, [load])

  const submitNote = async (): Promise<void> => {
    setSubmitting(true)
    setErrorMessage(null)
    try {
      await createMercflowOrderNote(orderId, draft)
      setDraft("")
      await load()
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not save note"
      setErrorMessage(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const removeNote = async (noteId: string): Promise<void> => {
    setDeletingId(noteId)
    setErrorMessage(null)
    try {
      await deleteMercflowOrderNote(orderId, noteId)
      await load()
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not delete note"
      setErrorMessage(msg)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <section
      aria-label="Internal order notes"
      className="rounded-lg border border-border-subtle bg-surface-subtle px-4 py-4 shadow-sm"
    >
      <h2 className="text-sm font-semibold text-content-primary">Internal notes</h2>
      <p className="mt-1 text-xs text-content-secondary">
        MercFlow-only notes for your team. Never shown to customers or on the storefront.
      </p>

      {errorMessage !== null ? (
        <p className="mt-3 text-sm text-feedback-danger-content" role="alert">
          {errorMessage}
        </p>
      ) : null}

      {loading ? (
        <p className="mt-4 text-sm text-content-secondary" aria-live="polite">
          Loading notes…
        </p>
      ) : notes.length === 0 ? (
        <p className="mt-4 text-sm text-content-secondary">No internal notes yet.</p>
      ) : (
        <ul className="mt-4 space-y-3" aria-label="Saved internal notes">
          {notes.map((note) => (
            <li
              key={note.id}
              className="rounded-md border border-border-default bg-surface-default px-3 py-3 text-sm"
            >
              <p className="whitespace-pre-wrap text-content-primary">{note.content}</p>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-content-tertiary">
                <span>
                  {note.created_by} ·{" "}
                  <time dateTime={note.created_at}>
                    {new Date(note.created_at).toLocaleString("da-DK", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </time>
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={deletingId !== null}
                  onClick={() => {
                    void removeNote(note.id)
                  }}
                >
                  {deletingId === note.id ? "Removing…" : "Remove"}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 border-t border-border-subtle pt-4">
        <Label htmlFor="mercflow-order-note" className="text-content-primary">
          Add note
        </Label>
        <textarea
          id="mercflow-order-note"
          rows={3}
          value={draft}
          disabled={submitting}
          onChange={(ev) => {
            setDraft(ev.target.value)
          }}
          className="mt-2 w-full max-w-xl rounded-md border border-border-default bg-surface-default px-3 py-2 text-sm text-content-primary shadow-sm focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-border-focus disabled:opacity-60"
        />
        <div className="mt-2">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={submitting || draft.trim() === ""}
            onClick={() => {
              void submitNote()
            }}
          >
            {submitting ? "Saving…" : "Save note"}
          </Button>
        </div>
      </div>
    </section>
  )
}
