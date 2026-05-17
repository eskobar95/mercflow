import { Module } from "@medusajs/framework/utils"

import SeoModuleService from "./service"

export const SEO_MODULE = "mercflow_seo"

export default Module(SEO_MODULE, {
  service: SeoModuleService,
})
