import { medusa } from "./medusa"

const REGION_ID = process.env.NEXT_PUBLIC_MEDUSA_REGION_ID!

export async function createCart() {
  return medusa.store.cart.create({
    region_id: REGION_ID,
    currency_code: "cop",
  })
}

export async function retrieveCart(cartId: string) {
  return medusa.store.cart.retrieve(cartId, {
    fields: "*items,+items.metadata,+items.variant,+items.variant.metadata",
  } as any)
}

export async function transferCart(cartId: string) {
  return medusa.store.cart.transferCart(cartId)
}

export async function updateCartAddresses(
  cartId: string,
  payload: {
    email?: string
    shipping_address?: Record<string, any>
    billing_address?: Record<string, any>
  }
) {
  return medusa.store.cart.update(cartId, payload)
}

export async function createLineItem(
  cartId: string,
  payload: {
    variant_id: string
    quantity: number
    metadata?: Record<string, any>
  }
) {
  return medusa.store.cart.createLineItem(cartId, {
    variant_id: payload.variant_id,
    quantity: payload.quantity,
  })
}

export async function updateLineItem(
  cartId: string,
  lineItemId: string,
  quantity: number
) {
  return medusa.store.cart.updateLineItem(cartId, lineItemId, {
    quantity,
  })
}

export async function deleteLineItem(cartId: string, lineItemId: string) {
  return medusa.store.cart.deleteLineItem(cartId, lineItemId)
}
