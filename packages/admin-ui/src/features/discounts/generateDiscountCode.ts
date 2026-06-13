const DISCOUNT_CODE_CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"

export function generateDiscountCode(length = 8): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length))
  return Array.from(bytes, (byte) => DISCOUNT_CODE_CHARSET[byte % DISCOUNT_CODE_CHARSET.length]).join("")
}
