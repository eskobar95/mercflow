import { Module } from "@medusajs/framework/utils"

import { validateEncryptionKeyAtStartup } from "./encryption-service"
import PaymentModuleService from "./service"
import { PAYMENT_MODULE } from "./types"

validateEncryptionKeyAtStartup()

export { PAYMENT_MODULE }

export default Module(PAYMENT_MODULE, {
  service: PaymentModuleService,
})
