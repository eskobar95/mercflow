import { Module } from "@medusajs/framework/utils"

import PackagingModuleService from "./service"

export const PACKAGING_MODULE = "packaging"

export default Module(PACKAGING_MODULE, {
  service: PackagingModuleService,
})
