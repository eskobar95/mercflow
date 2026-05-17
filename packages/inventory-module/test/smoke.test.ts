import { expect, it } from "vitest"

import { INVENTORY_MODULE } from "../src/modules/inventory"

it("exposes inventory module key", (): void => {
  expect(INVENTORY_MODULE).toBe("mercflow_inventory")
})
