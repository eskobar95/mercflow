import { randomBytes } from "crypto"

function buildPasswordAlphabet(): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ"
  const lower = "abcdefghijkmnopqrstuvwxyz"
  const digits = "23456789"
  return upper + lower + digits
}

const PASSWORD_ALPHABET = buildPasswordAlphabet()

export function generateTenantAdminPassword(length = 16): string {
  const bytes = randomBytes(length)
  let password = ""
  for (let index = 0; index < length; index += 1) {
    password += PASSWORD_ALPHABET[bytes[index] % PASSWORD_ALPHABET.length]
  }
  return password
}
