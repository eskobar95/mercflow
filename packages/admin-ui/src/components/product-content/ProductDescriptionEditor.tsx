import CharacterCount from "@tiptap/extension-character-count"
import Image from "@tiptap/extension-image"
import Link from "@tiptap/extension-link"
import { EditorContent, useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import { useEffect } from "react"

import type { JSONContent } from "@tiptap/core"

import { tiptapDocFromUnknown } from "./tiptapDoc"

const DESCRIPTIVE_LABEL_ID = "product-description-editor-label"

export type ProductDescriptionEditorProps = {
  /** TipTap / ProseMirror JSON document */
  value: unknown
  onChange: (json: JSONContent) => void
  disabled?: boolean
}

export function ProductDescriptionEditor({
  value,
  onChange,
  disabled = false,
}: ProductDescriptionEditorProps): JSX.Element {
  const initial = tiptapDocFromUnknown(value)

  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({
          heading: { levels: [2, 3] },
        }),
        Link.configure({
          openOnClick: false,
        }),
        Image.configure({
          allowBase64: false,
        }),
        CharacterCount.configure({
          limit: 100_000,
        }),
      ],
      content: initial,
      editable: !disabled,
      editorProps: {
        attributes: {
          "aria-labelledby": DESCRIPTIVE_LABEL_ID,
          class:
            "prose-editor min-h-32 max-w-none px-3 py-2 text-sm text-content-primary focus:outline-none [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:list-disc [&_ul]:pl-6",
        },
      },
      onUpdate: ({ editor: ed }) => {
        onChange(ed.getJSON())
      },
    },
    []
  )

  useEffect(() => {
    if (!editor || editor.isDestroyed) {
      return
    }
    const next = tiptapDocFromUnknown(value)
    const current = editor.getJSON()
    if (JSON.stringify(current) === JSON.stringify(next)) {
      return
    }
    editor.commands.setContent(next, { emitUpdate: false })
  }, [editor, value])

  useEffect(() => {
    if (!editor || editor.isDestroyed) {
      return
    }
    editor.setEditable(!disabled)
  }, [editor, disabled])

  const onBold = (): void => {
    editor?.chain().focus().toggleBold().run()
  }
  const onItalic = (): void => {
    editor?.chain().focus().toggleItalic().run()
  }
  const onBullet = (): void => {
    editor?.chain().focus().toggleBulletList().run()
  }
  const onOrdered = (): void => {
    editor?.chain().focus().toggleOrderedList().run()
  }
  const onLink = (): void => {
    const url = window.prompt("Link URL")
    if (url === null || url.trim() === "") {
      return
    }
    editor?.chain().focus().setLink({ href: url.trim() }).run()
  }
  const onImage = (): void => {
    const src = window.prompt("Image URL")
    if (src === null || src.trim() === "") {
      return
    }
    editor?.chain().focus().setImage({ src: src.trim() }).run()
  }

  const chars =
    editor && !editor.isDestroyed
      ? editor.storage.characterCount?.characters() ?? 0
      : 0

  return (
    <div className="rounded-md border border-border-default bg-surface-default shadow-sm">
      <span id={DESCRIPTIVE_LABEL_ID} className="sr-only">
        Rich text description editor
      </span>
      <div
        className="flex flex-wrap gap-1 border-b border-border-subtle bg-surface-subtle px-2 py-1.5"
        role="toolbar"
        aria-label="Text formatting"
      >
        <button
          type="button"
          onClick={onBold}
          disabled={disabled || !editor}
          className="rounded px-2 py-1 text-xs font-semibold text-content-primary hover:bg-surface-raised disabled:opacity-50"
          aria-pressed={editor?.isActive("bold") ?? false}
        >
          Bold
        </button>
        <button
          type="button"
          onClick={onItalic}
          disabled={disabled || !editor}
          className="rounded px-2 py-1 text-xs italic text-content-primary hover:bg-surface-raised disabled:opacity-50"
          aria-pressed={editor?.isActive("italic") ?? false}
        >
          Italic
        </button>
        <button
          type="button"
          onClick={onBullet}
          disabled={disabled || !editor}
          className="rounded px-2 py-1 text-xs text-content-primary hover:bg-surface-raised disabled:opacity-50"
          aria-pressed={editor?.isActive("bulletList") ?? false}
        >
          Bullets
        </button>
        <button
          type="button"
          onClick={onOrdered}
          disabled={disabled || !editor}
          className="rounded px-2 py-1 text-xs text-content-primary hover:bg-surface-raised disabled:opacity-50"
          aria-pressed={editor?.isActive("orderedList") ?? false}
        >
          Numbered
        </button>
        <button
          type="button"
          onClick={onLink}
          disabled={disabled || !editor}
          className="rounded px-2 py-1 text-xs text-content-primary hover:bg-surface-raised disabled:opacity-50"
        >
          Link
        </button>
        <button
          type="button"
          onClick={onImage}
          disabled={disabled || !editor}
          className="rounded px-2 py-1 text-xs text-content-primary hover:bg-surface-raised disabled:opacity-50"
        >
          Image
        </button>
        <span className="ml-auto text-xs text-content-tertiary" aria-live="polite">
          {chars} characters
        </span>
      </div>
      <EditorContent editor={editor} />
      {!editor ? (
        <p className="px-3 py-2 text-sm text-content-secondary">Preparing editor…</p>
      ) : null}
    </div>
  )
}
