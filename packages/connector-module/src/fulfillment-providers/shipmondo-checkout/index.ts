import { ModuleProvider, Modules } from "@medusajs/framework/utils"

import ShipmondoCheckoutFulfillmentProviderService from "./service"

export default ModuleProvider(Modules.FULFILLMENT, {
  services: [ShipmondoCheckoutFulfillmentProviderService],
})
