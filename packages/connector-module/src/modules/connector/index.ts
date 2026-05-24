import { Module } from "@medusajs/framework/utils"

import ConnectorModuleService from "./service"

export const CONNECTOR_MODULE = "connector"

export default Module(CONNECTOR_MODULE, {
  service: ConnectorModuleService,
})
