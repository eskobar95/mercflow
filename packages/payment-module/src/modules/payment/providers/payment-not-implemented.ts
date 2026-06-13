import { MedusaError } from "@medusajs/utils"

export class PaymentNotImplementedError extends MedusaError {
  constructor(methodName: string) {
    super(
      MedusaError.Types.NOT_ALLOWED,
      `Payment provider method "${methodName}" is not implemented in v1`
    )
  }
}

export function throwPaymentNotImplemented(methodName: string): never {
  throw new PaymentNotImplementedError(methodName)
}
