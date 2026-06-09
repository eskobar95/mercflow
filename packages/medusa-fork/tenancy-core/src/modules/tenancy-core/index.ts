import { Module } from "@medusajs/framework/utils"

import TenancyCoreModuleService from "./service"

export const TENANCY_CORE_MODULE = "tenancyCore"

export default Module(TENANCY_CORE_MODULE, {
  service: TenancyCoreModuleService,
})
