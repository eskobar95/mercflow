import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { EMPTY_TIPTAP_DOC, RichTextEditor } from "@/components/ui/RichTextEditor"

describe("RichTextEditor", (): void => {
  it("exposes Heading 2 and Heading 3 controls in full toolbar mode", async (): Promise<void> => {
    render(
      <RichTextEditor
        extensions="full"
        variant="standalone"
        value={EMPTY_TIPTAP_DOC}
        onChange={() => undefined}
      />
    )

    expect(await screen.findByRole("button", { name: "Heading 2" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Heading 3" })).toBeInTheDocument()
  })
})
