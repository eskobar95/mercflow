import type { GoogleShoppingFeedItem } from "./types"

const G_NS = "http://base.google.com/ns/1.0"

function escapeXmlText(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

function optionalElement(tag: string, value: string | null | undefined): string {
  if (value == null || value.trim() === "") {
    return ""
  }
  return `<${tag}>${escapeXmlText(value.trim())}</${tag}>`
}

function googleElement(localName: string, value: string | null | undefined): string {
  if (value == null || value.trim() === "") {
    return ""
  }
  return `<g:${localName}>${escapeXmlText(value.trim())}</g:${localName}>`
}

function renderItem(item: GoogleShoppingFeedItem): string {
  const parts = [
    "<item>",
    googleElement("id", item.id),
    googleElement("title", item.title),
    googleElement("description", item.description),
    googleElement("link", item.link),
    googleElement("image_link", item.image_link),
    googleElement("price", item.price),
    googleElement("availability", item.availability),
    googleElement("brand", item.brand),
    googleElement("condition", item.condition),
    "</item>",
  ]
  return parts.filter((line) => line.length > 0).join("")
}

export type BuildGoogleShoppingXmlInput = {
  channelTitle: string
  channelLink: string
  channelDescription: string
  items: GoogleShoppingFeedItem[]
}

/**
 * Builds a Google Shopping RSS 2.0 document with the `g` namespace.
 */
export function buildGoogleShoppingXml(input: BuildGoogleShoppingXmlInput): string {
  const itemsXml = input.items.map(renderItem).join("")
  return (
    '<?xml version="1.0" encoding="UTF-8"?>' +
    `<rss version="2.0" xmlns:g="${G_NS}">` +
    "<channel>" +
    optionalElement("title", input.channelTitle) +
    optionalElement("link", input.channelLink) +
    optionalElement("description", input.channelDescription) +
    itemsXml +
    "</channel>" +
    "</rss>"
  )
}
