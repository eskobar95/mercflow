import { renderHook } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { useUnsavedFormGuard } from "./useUnsavedFormGuard"

describe("useUnsavedFormGuard", (): void => {
  afterEach((): void => {
    document.title = "MercFlow Admin"
  })

  it("prefixes document.title when dirty", (): void => {
    renderHook(() =>
      useUnsavedFormGuard({
        isDirty: true,
        baseTitle: "Blue T-Shirt",
      }),
    )

    expect(document.title).toBe("• Blue T-Shirt")
  })

  it("restores the clean title when dirty becomes false", (): void => {
    const { rerender } = renderHook(
      ({ isDirty }: { isDirty: boolean }) =>
        useUnsavedFormGuard({
          isDirty,
          baseTitle: "Blue T-Shirt",
        }),
      { initialProps: { isDirty: true } },
    )

    expect(document.title).toBe("• Blue T-Shirt")

    rerender({ isDirty: false })

    expect(document.title).toBe("Blue T-Shirt")
  })

  it("registers beforeunload only while dirty", (): void => {
    const addSpy = vi.spyOn(window, "addEventListener")
    const removeSpy = vi.spyOn(window, "removeEventListener")

    const { rerender, unmount } = renderHook(
      ({ isDirty }: { isDirty: boolean }) =>
        useUnsavedFormGuard({
          isDirty,
          baseTitle: "Create product",
        }),
      { initialProps: { isDirty: false } },
    )

    expect(addSpy).not.toHaveBeenCalledWith("beforeunload", expect.any(Function))

    rerender({ isDirty: true })

    expect(addSpy).toHaveBeenCalledWith("beforeunload", expect.any(Function))

    const handler = addSpy.mock.calls.find(([eventName]) => eventName === "beforeunload")?.[1]
    expect(handler).toBeTypeOf("function")

    const event = new Event("beforeunload") as BeforeUnloadEvent
    const preventDefault = vi.spyOn(event, "preventDefault")
    ;(handler as EventListener)(event)

    expect(preventDefault).toHaveBeenCalled()
    expect(event.returnValue).toBeTruthy()

    unmount()

    expect(removeSpy).toHaveBeenCalledWith("beforeunload", handler)

    addSpy.mockRestore()
    removeSpy.mockRestore()
  })
})
