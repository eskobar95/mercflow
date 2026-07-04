import { Module } from "@medusajs/framework/utils"

import InventoryModuleService from "./service"

/** Distinct from Medusa core `@medusajs/inventory` (`inventory` / `inventory_item`). */
export const INVENTORY_MODULE = "mercflow_inventory"

export default Module(INVENTORY_MODULE, {
  service: InventoryModuleService,
})
