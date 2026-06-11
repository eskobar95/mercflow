import { createServer } from "node:http"

import { createElement } from "react"
import { render } from "@react-email/render"

import {
  buildSampleOrderConfirmationProps,
  OrderConfirmationTemplate,
} from "../src/templates"

const PORT = Number.parseInt(process.env.EMAIL_PREVIEW_PORT ?? "3005", 10)

async function main(): Promise<void> {
  const html = await render(
    createElement(OrderConfirmationTemplate, buildSampleOrderConfirmationProps())
  )

  const server = createServer((_request, response) => {
    response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" })
    response.end(html)
  })

  server.listen(PORT, () => {
    process.stdout.write(`Order confirmation preview: http://localhost:${PORT}\n`)
  })
}

void main()
