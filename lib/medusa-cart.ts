import { medusa } from "./medusa"

export async function createCart() {
  return medusa.store.cart.create({
    region_id: "reg_01KMA9MZQ6YJ7K7BN8Y5R6Q8Q9",
    currency_code: "cop",
  })
}

export async function retrieveCart(cartId: string) {
  return medusa.store.cart.retrieve(cartId)
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
  await medusa.store.cart.createLineItem(cartId, payload)

  return medusa.store.cart.retrieve(cartId)
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
