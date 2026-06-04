import { describe, expect, it } from "vitest"

import {
  slugifyTitleToArticleSegment,
  transliterateNordicForSlug,
} from "../../src/modules/content/utils/transliterate-nordic-slug"

describe("transliterateNordicForSlug", () => {
  it("maps Nordic vowels per MER-34", () => {
    expect(transliterateNordicForSlug("Øl")).toBe("ol")
    expect(transliterateNordicForSlug("År")).toBe("ar")
    expect(transliterateNordicForSlug("Æble")).toBe("aeble")
    expect(transliterateNordicForSlug("Öl")).toBe("ol")
    expect(transliterateNordicForSlug("Älg")).toBe("alg")
  })
})

describe("slugifyTitleToArticleSegment", () => {
  it("slugifies with Nordic transliteration", () => {
    expect(slugifyTitleToArticleSegment("Smørrebrød i København")).toBe(
      "smorrebrod-i-kobenhavn"
    )
  })

  it("falls back when title is punctuation-only", () => {
    expect(slugifyTitleToArticleSegment("!!!")).toBe("article")
  })
})
