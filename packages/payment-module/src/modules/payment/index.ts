import { Module } from "@medusajs/framework/utils"

import { validateEncryptionKeyAtStartup } from "./encryption-service"
import PaymentModuleService from "./service"
import { PAYMENT_MODULE } from "./types"

const isDbCliCommand = process.argv.some((arg) =>
  /db:(migrate|generate|rollback|revert|seed)/.test(arg)
)

if (!isDbCliCommand && process.env.VITEST !== "true") {
  validateEncryptionKeyAtStartup()
}

export { PAYMENT_MODULE }

export default Module(PAYMENT_MODULE, {
  service: PaymentModuleService,
})
