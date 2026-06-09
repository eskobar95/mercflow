import { describe, expect, it } from "vitest"

import { slugifyForStrategy } from "../src/slug.js"

describe("slugifyForStrategy", (): void => {
  it("transliterates Nordic characters with nordic strategy", (): void => {
    expect(slugifyForStrategy("Rødgrød med fløde", "nordic")).toBe("roedgroed-med-floede")
    expect(slugifyForStrategy("Æble & Åben", "nordic")).toBe("aeble-aaben")
  })

  it("transliterates Nordic characters with omit strategy", (): void => {
    expect(slugifyForStrategy("Rødgrød", "omit")).toBe("rodgrod")
    expect(slugifyForStrategy("Ærø", "omit")).toBe("aro")
  })

  it("removes special characters and collapses spaces to hyphens", (): void => {
    expect(slugifyForStrategy("Hello World!!!", "nordic")).toBe("hello-world")
  })
})
