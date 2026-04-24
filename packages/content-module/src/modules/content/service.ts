import { MedusaService } from "@medusajs/framework/utils"

import { CategoryContent } from "./models/category-content"
import { ProductContent } from "./models/product-content"

class ContentModuleService extends MedusaService({
  ProductContent,
  CategoryContent,
}) {}

export default ContentModuleService
