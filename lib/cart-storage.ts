const CART_ID_KEY = "medusa_cart_id"

export function getStoredCartId() {
  if (typeof window === "undefined") return null
  return localStorage.getItem(CART_ID_KEY)
}

export function setStoredCartId(cartId: string) {
  if (typeof window === "undefined") return
  localStorage.setItem(CART_ID_KEY, cartId)
}

export function removeStoredCartId() {
  if (typeof window === "undefined") return
  localStorage.removeItem(CART_ID_KEY)
}