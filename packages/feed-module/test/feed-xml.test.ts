import { describe, expect, it } from "vitest"

import { buildGoogleShoppingXml } from "../src/modules/feed/feed-xml"

describe("buildGoogleShoppingXml", (): void => {
  it("returns valid RSS with g namespace and escaped text", (): void => {
    const xml = buildGoogleShoppingXml({
      channelTitle: "Test & Co",
      channelLink: "https://shop.example",
      channelDescription: "Feed",
      items: [
        {
          id: "SKU-1",
          title: "Mug <large>",
          description: "A & B",
          link: "https://shop.example/mug",
          image_link: "https://cdn.example/mug.jpg",
          price: "10.00 DKK",
          availability: "in stock",
          brand: "Brand",
          condition: "new",
        },
      ],
    })

    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>')
    expect(xml).toContain('xmlns:g="http://base.google.com/ns/1.0"')
    expect(xml).toContain("<g:id>SKU-1</g:id>")
    expect(xml).toContain("<g:title>Mug &lt;large&gt;</g:title>")
    expect(xml).toContain("<g:description>A &amp; B</g:description>")
    expect(xml).toContain("<g:link>https://shop.example/mug</g:link>")
  })
})
