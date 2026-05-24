import CharacterCount from "@tiptap/extension-character-count"
import Image from "@tiptap/extension-image"
import Link from "@tiptap/extension-link"
import { EditorContent, useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import * as Popover from "@radix-ui/react-popover"
import { useEffect, useId, useState } from "react"

import type { JSONContent } from "@tiptap/core"

import { Button } from "@/components/ui/Button"
import {
  overlayPanelClass,
  toolbarIconButtonClass,
} from "@/components/ui/formStyles"
import { Input } from "@/components/ui/Input"
import { cn } from "@/lib/cn"
import { tiptapDocFromUnknown } from "@/lib/tiptap"

export type RichTextEditorMode = "simple" | "full"
type RichTextEditorVariant = "standalone" | "embedded"

export type RichTextEditorProps = {
  value: JSONContent | null | unknown
  onChange: (json: JSONContent) => void
  disabled?: boolean
  placeholder?: string
  extensions?: RichTextEditorMode
  maxLength?: number
  /** Screen-reader label for the editor surface. */
  label?: string
  error?: boolean
  className?: string
  /**
   * `embedded` — sits inside a Card (no outer border/shadow; card owns chrome).
   * `standalone` — self-contained bordered surface.
   */
  variant?: RichTextEditorVariant
}

type ToolbarButtonProps = {
  label: string
  pressed?: boolean
  disabled?: boolean
  onClick: () => void
  children: React.ReactNode
}

function ToolbarButton({
  label,
  pressed = false,
  disabled = false,
  onClick,
  children,
}: ToolbarButtonProps): JSX.Element {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        toolbarIconButtonClass,
        "text-xs font-semibold",
        pressed ? "bg-surface-subtle text-content-primary" : "",
      )}
      style={{ transitionTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)" }}
    >
      {children}
    </button>
  )
}

function LinkPopover({
  disabled,
  onApply,
  onRemove,
  hasLink,
}: {
  disabled: boolean
  onApply: (url: string) => void
  onRemove: () => void
  hasLink: boolean
}): JSX.Element {
  const [open, setOpen] = useState(false)
  const [url, setUrl] = useState("")

  return (
    <Popover.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) {
          setUrl("")
        }
      }}
    >
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-label="Insert link"
          disabled={disabled}
          className={cn(
            toolbarIconButtonClass,
            "text-xs",
            hasLink ? "bg-surface-subtle text-content-primary" : "",
          )}
          style={{ transitionTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)" }}
        >
          Link
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          sideOffset={6}
          align="start"
          className={cn(
            overlayPanelClass,
            "z-popover w-72 p-3",
            "origin-[var(--radix-popover-content-transform-origin)]",
          )}
          style={{
            transitionProperty: "opacity, transform",
            transitionDuration: "150ms",
            transitionTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)",
          }}
        >
          <label className="text-xs font-medium text-content-secondary" htmlFor="rte-link-url">
            URL
          </label>
          <Input
            id="rte-link-url"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value)
            }}
            placeholder="https://"
            className="mt-1"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                const trimmed = url.trim()
                if (trimmed) {
                  onApply(trimmed)
                  setOpen(false)
                  setUrl("")
                }
              }
            }}
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="primary"
              disabled={!url.trim()}
              onClick={() => {
                onApply(url.trim())
                setOpen(false)
                setUrl("")
              }}
            >
              Apply
            </Button>
            {hasLink ? (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  onRemove()
                  setOpen(false)
                }}
              >
                Remove
              </Button>
            ) : null}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

/**
 * Reusable TipTap v3 rich text editor — flat when embedded in Card, toolbar + prose surface.
 */
export function RichTextEditor({
  value,
  onChange,
  disabled = false,
  placeholder = "Write something…",
  extensions = "simple",
  maxLength = 100_000,
  label = "Rich text editor",
  error = false,
  className,
  variant = "standalone",
}: RichTextEditorProps): JSX.Element {
  const labelId = useId()
  const initial = tiptapDocFromUnknown(value)
  const embedded = variant === "embedded"

  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({
          heading: extensions === "full" ? { levels: [2, 3] } : false,
          /** Starter Kit includes Link; in full mode we disable it and register Link below */
          ...(extensions === "full" ? { link: false } : {}),
        }),
        ...(extensions === "full"
          ? [Link.configure({ openOnClick: false })]
          : []),
        ...(extensions === "full"
          ? [
              Image.configure({ allowBase64: false }),
              CharacterCount.configure({ limit: maxLength }),
            ]
          : [CharacterCount.configure({ limit: maxLength })]),
      ],
      content: initial,
      editable: !disabled,
      editorProps: {
        attributes: {
          "aria-labelledby": labelId,
          "data-placeholder": placeholder,
          class: cn(
            "prose-editor min-h-36 max-w-none text-sm leading-relaxed text-content-primary focus:outline-none",
            embedded ? "px-6 py-4" : "px-4 py-3",
            "[&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:list-disc [&_ul]:pl-6",
            "[&_a]:text-accent-text [&_a]:underline",
            "[&_p.is-editor-empty:first-child]:before:pointer-events-none",
            "[&_p.is-editor-empty:first-child]:before:float-left",
            "[&_p.is-editor-empty:first-child]:before:h-0",
            "[&_p.is-editor-empty:first-child]:before:text-content-tertiary",
            "[&_p.is-editor-empty:first-child]:before:content-[attr(data-placeholder)]",
          ),
        },
      },
      onUpdate: ({ editor: ed }) => {
        onChange(ed.getJSON())
      },
    },
    [extensions, embedded, placeholder],
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

  const chars =
    editor && !editor.isDestroyed
      ? (editor.storage.characterCount?.characters() as number | undefined) ?? 0
      : 0

  const toolbarDisabled = disabled || !editor

  return (
    <div
      className={cn(
        embedded
          ? "bg-surface-default"
          : cn(
              "rounded-sm border bg-surface-default",
              error ? "border-feedback-danger" : "border-border-default",
            ),
        className,
      )}
    >
      <span id={labelId} className="sr-only">
        {label}
      </span>
      <div
        className={cn(
          "flex flex-wrap items-center gap-0.5 border-b border-border-subtle bg-surface-default",
          embedded ? "px-3 py-1" : "px-2 py-1",
        )}
        role="toolbar"
        aria-label="Text formatting"
      >
        <ToolbarButton
          label="Bold"
          pressed={editor?.isActive("bold") ?? false}
          disabled={toolbarDisabled}
          onClick={() => {
            editor?.chain().focus().toggleBold().run()
          }}
        >
          B
        </ToolbarButton>
        <ToolbarButton
          label="Italic"
          pressed={editor?.isActive("italic") ?? false}
          disabled={toolbarDisabled}
          onClick={() => {
            editor?.chain().focus().toggleItalic().run()
          }}
        >
          <span className="italic">I</span>
        </ToolbarButton>
        {extensions === "full" ? (
          <>
            <span className="mx-1 h-5 w-px bg-border-default" aria-hidden />
            <ToolbarButton
              label="Heading 2"
              pressed={editor?.isActive("heading", { level: 2 }) ?? false}
              disabled={toolbarDisabled}
              onClick={() => {
                editor?.chain().focus().toggleHeading({ level: 2 }).run()
              }}
            >
              H2
            </ToolbarButton>
            <ToolbarButton
              label="Heading 3"
              pressed={editor?.isActive("heading", { level: 3 }) ?? false}
              disabled={toolbarDisabled}
              onClick={() => {
                editor?.chain().focus().toggleHeading({ level: 3 }).run()
              }}
            >
              H3
            </ToolbarButton>
          </>
        ) : null}
        <span className="mx-1 h-5 w-px bg-border-default" aria-hidden />
        <ToolbarButton
          label="Bullet list"
          pressed={editor?.isActive("bulletList") ?? false}
          disabled={toolbarDisabled}
          onClick={() => {
            editor?.chain().focus().toggleBulletList().run()
          }}
        >
          •
        </ToolbarButton>
        <ToolbarButton
          label="Numbered list"
          pressed={editor?.isActive("orderedList") ?? false}
          disabled={toolbarDisabled}
          onClick={() => {
            editor?.chain().focus().toggleOrderedList().run()
          }}
        >
          1.
        </ToolbarButton>
        {extensions === "full" ? (
          <>
            <span className="mx-1 h-5 w-px bg-border-default" aria-hidden />
            <LinkPopover
              disabled={toolbarDisabled}
              hasLink={editor?.isActive("link") ?? false}
              onApply={(url) => {
                editor?.chain().focus().setLink({ href: url }).run()
              }}
              onRemove={() => {
                editor?.chain().focus().unsetLink().run()
              }}
            />
            <ToolbarButton
              label="Insert image"
              disabled={toolbarDisabled}
              onClick={() => {
                const src = window.prompt("Image URL")
                if (src?.trim()) {
                  editor?.chain().focus().setImage({ src: src.trim() }).run()
                }
              }}
            >
              Img
            </ToolbarButton>
          </>
        ) : null}
        <span className="ml-auto text-xs tabular-nums text-content-tertiary" aria-live="polite">
          {chars} characters
        </span>
      </div>
      <EditorContent editor={editor} />
      {!editor ? (
        <p className="px-4 py-3 text-sm text-content-secondary">Preparing editor…</p>
      ) : null}
    </div>
  )
}
