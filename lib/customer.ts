import { cookies } from "next/headers"

export async function getCustomer() {
  try {
    const token = cookies().get("_medusa_jwt")?.value

    if (!token) return null

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/store/customers/me`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      }
    )

    if (!res.ok) return null

    const { customer } = await res.json()
    return customer
  } catch (error) {
    return null
  }
}
