import { Module } from "@medusajs/framework/utils"

import NotificationModuleService from "./service"
import { NOTIFICATION_MODULE } from "./types"

export { NOTIFICATION_MODULE }

export default Module(NOTIFICATION_MODULE, {
  service: NotificationModuleService,
})
