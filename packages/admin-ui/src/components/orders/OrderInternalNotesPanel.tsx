import { type ReactNode, useCallback, useEffect, useReducer } from "react"

import { Button } from "@/components/ui/Button"
import { FormField } from "@/components/ui/FormField"
import { Textarea } from "@/components/ui/Textarea"
import {
  createMercflowOrderNote,
  deleteMercflowOrderNote,
  fetchMercflowOrderNotes,
  type MercflowOrderNote,
} from "@/features/orders/orderNotesAdminApi"

type OrderNotesPanelState = {
  notes: MercflowOrderNote[]
  loading: boolean
  errorMessage: string | null
  draft: string
  submitting: boolean
  deletingId: string | null
}

type OrderNotesPanelAction =
  | { type: "loadStart" }
  | { type: "loadSuccess"; notes: MercflowOrderNote[] }
  | { type: "loadError"; message: string }
  | { type: "loadFinish" }
  | { type: "setDraft"; value: string }
  | { type: "submitStart" }
  | { type: "submitSuccess" }
  | { type: "submitError"; message: string }
  | { type: "deleteStart"; noteId: string }
  | { type: "deleteError"; message: string }
  | { type: "deleteFinish" }

const INITIAL_ORDER_NOTES_PANEL_STATE: OrderNotesPanelState = {
  notes: [],
  loading: true,
  errorMessage: null,
  draft: "",
  submitting: false,
  deletingId: null,
}

function orderNotesPanelReducer(
  state: OrderNotesPanelState,
  action: OrderNotesPanelAction,
): OrderNotesPanelState {
  switch (action.type) {
    case "loadStart":
      return { ...state, loading: true, errorMessage: null }
    case "loadSuccess":
      return { ...state, notes: action.notes }
    case "loadError":
      return { ...state, notes: [], errorMessage: action.message }
    case "loadFinish":
      return { ...state, loading: false }
    case "setDraft":
      return { ...state, draft: action.value }
    case "submitStart":
      return { ...state, submitting: true, errorMessage: null }
    case "submitSuccess":
      return { ...state, submitting: false, draft: "" }
    case "submitError":
      return { ...state, submitting: false, errorMessage: action.message }
    case "deleteStart":
      return { ...state, deletingId: action.noteId, errorMessage: null }
    case "deleteError":
      return { ...state, errorMessage: action.message }
    case "deleteFinish":
      return { ...state, deletingId: null }
    default:
      return state
  }
}

export function OrderInternalNotesPanel(props: { orderId: string }): ReactNode {
  const { orderId } = props
  const [ui, dispatch] = useReducer(orderNotesPanelReducer, INITIAL_ORDER_NOTES_PANEL_STATE)
  const { notes, loading, errorMessage, draft, submitting, deletingId } = ui

  const load = useCallback(async (): Promise<void> => {
    dispatch({ type: "loadStart" })
    try {
      const rows = await fetchMercflowOrderNotes(orderId)
      dispatch({ type: "loadSuccess", notes: rows })
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load internal notes"
      dispatch({ type: "loadError", message: msg })
    } finally {
      dispatch({ type: "loadFinish" })
    }
  }, [orderId])

  useEffect(() => {
    void load()
  }, [load])

  const submitNote = async (): Promise<void> => {
    dispatch({ type: "submitStart" })
    try {
      await createMercflowOrderNote(orderId, draft)
      dispatch({ type: "submitSuccess" })
      await load()
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not save note"
      dispatch({ type: "submitError", message: msg })
    }
  }

  const removeNote = async (noteId: string): Promise<void> => {
    dispatch({ type: "deleteStart", noteId })
    try {
      await deleteMercflowOrderNote(orderId, noteId)
      await load()
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not delete note"
      dispatch({ type: "deleteError", message: msg })
    } finally {
      dispatch({ type: "deleteFinish" })
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
        <FormField label="Add note" htmlFor="mercflow-order-note">
          <Textarea
            id="mercflow-order-note"
            rows={3}
            value={draft}
            disabled={submitting}
            onChange={(ev) => {
              dispatch({ type: "setDraft", value: ev.target.value })
            }}
            className="max-w-xl"
          />
        </FormField>
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
