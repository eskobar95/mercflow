import "@testing-library/jest-dom/vitest"

import { cleanup } from "@testing-library/react"
import { afterEach } from "vitest"

// Auto-unmount React trees between tests. Without this, multiple `it`
// blocks in the same file would share the JSDOM, producing duplicate
// elements that break role/name queries.
afterEach(() => {
  cleanup()
})
