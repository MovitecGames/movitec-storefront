import { medusa } from "./medusa"
import { cookies } from "next/headers"

export async function getCustomer() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("_medusa_jwt")?.value

    if (!token) return null

    const { customer } = await medusa.store.customer.retrieve()

    return customer
  } catch (error) {
    return null
  }
}
