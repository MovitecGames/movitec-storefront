import { medusa } from "./medusa"

export async function getCustomer() {
  try {
    const { customer } = await medusa.store.customer.retrieve()
    return customer
  } catch (error) {
    return null
  }
}