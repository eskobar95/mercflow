import type { AdminCustomer } from "./customersAdminTypes"

export function customerDisplayName(customer: AdminCustomer): string {
  const first = customer.first_name?.trim() ?? ""
  const last = customer.last_name?.trim() ?? ""
  const merged = `${first} ${last}`.trim()
  if (merged !== "") {
    return merged
  }
  const email = customer.email?.trim() ?? ""
  if (email !== "") {
    return email
  }
  return customer.id
}

export function customerEmailLabel(customer: AdminCustomer): string {
  const email = customer.email?.trim() ?? ""
  if (email !== "") {
    return email
  }
  return "—"
}
