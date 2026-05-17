import { Module } from "@medusajs/framework/utils"

import FeedModuleService from "./service"

export const FEED_MODULE = "mercflow_feed"

export default Module(FEED_MODULE, {
  service: FeedModuleService,
})
