import { randomBytes } from "crypto"

const PASSWORD_ALPHABET = [
  "ABCDEFGHJKLMNPQRSTUVWXYZ",
  "abcdefghijkmnopqrstuvwxyz",
  "23456789",
].join("")

export function generateTenantAdminPassword(length = 16): string {
  const bytes = randomBytes(length)
  let password = ""
  for (let index = 0; index < length; index += 1) {
    password += PASSWORD_ALPHABET[bytes[index] % PASSWORD_ALPHABET.length]
  }
  return password
}
