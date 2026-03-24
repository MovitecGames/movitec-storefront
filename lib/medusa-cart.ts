import { medusa } from "./medusa"

export async function createCart() {
  return medusa.store.cart.create({
    region_id: process.env.NEXT_PUBLIC_MEDUSA_REGION_ID!,
  })
}

export async function retrieveCart(cartId: string) {
  return medusa.store.cart.retrieve(cartId)
}

export async function createLineItem(
  cartId: string,
  variantId: string,
  quantity: number
) {
  return medusa.store.cart.createLineItem(cartId, {
    variant_id: variantId,
    quantity,
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

export async function transferCart(cartId: string) {
  return medusa.store.cart.transferCart(cartId)
}

export async function updateCartAddresses(
  cartId: string,
  data: {
    email?: string
    shipping_address: {
      first_name: string
      last_name: string
      company?: string
      address_1: string
      city: string
      province?: string
      postal_code?: string
      country_code: string
      phone?: string
    }
    billing_address?: {
      first_name: string
      last_name: string
      company?: string
      address_1: string
      city: string
      province?: string
      postal_code?: string
      country_code: string
      phone?: string
    }
  }
) {
  return medusa.store.cart.update(cartId, data)
}

export async function listCartShippingOptions(cartId: string) {
  return medusa.store.fulfillment.listCartOptions({
    cart_id: cartId,
  })
}

export async function addShippingMethod(
  cartId: string,
  optionId: string,
  data?: Record<string, any>
) {
  return medusa.store.cart.addShippingMethod(cartId, {
    option_id: optionId,
    data: data || {},
  })
}
