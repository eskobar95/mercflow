import { Module } from "@medusajs/framework/utils"

import InventoryModuleService from "./service"

export const INVENTORY_MODULE = "mercflow_inventory"

export default Module(INVENTORY_MODULE, {
  service: InventoryModuleService,
})
