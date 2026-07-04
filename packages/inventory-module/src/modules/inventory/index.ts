import { Module } from "@medusajs/framework/utils"

import InventoryModuleService from "./service"

export const INVENTORY_MODULE = "inventory"

export default Module(INVENTORY_MODULE, {
  service: InventoryModuleService,
})
