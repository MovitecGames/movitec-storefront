const CART_ID_KEY = "cart_id"
const CONFIRMED_BANK_ORDER_KEY = "confirmed_bank_order"

export function getStoredCartId() {
  if (typeof window === "undefined") return null

  const value = window.localStorage.getItem(CART_ID_KEY)
  return value && value.trim() ? value : null
}

export function setStoredCartId(cartId: string) {
  if (typeof window === "undefined") return

  const normalized = String(cartId || "").trim()

  if (!normalized) {
    window.localStorage.removeItem(CART_ID_KEY)
    return
  }

  window.localStorage.setItem(CART_ID_KEY, normalized)
}

export function clearStoredCartId() {
  if (typeof window === "undefined") return
  window.localStorage.removeItem(CART_ID_KEY)
}

export function getConfirmedBankOrder() {
  if (typeof window === "undefined") return null

  const value = window.localStorage.getItem(CONFIRMED_BANK_ORDER_KEY)
  return value && value.trim() ? value : null
}

export function setConfirmedBankOrder(orderId: string) {
  if (typeof window === "undefined") return

  const normalized = String(orderId || "").trim()

  if (!normalized) {
    window.localStorage.removeItem(CONFIRMED_BANK_ORDER_KEY)
    return
  }

  window.localStorage.setItem(CONFIRMED_BANK_ORDER_KEY, normalized)
}

export function clearConfirmedBankOrder() {
  if (typeof window === "undefined") return
  window.localStorage.removeItem(CONFIRMED_BANK_ORDER_KEY)
}

export function clearStoredCheckoutState() {
  if (typeof window === "undefined") return

  window.localStorage.removeItem(CART_ID_KEY)
  window.localStorage.removeItem(CONFIRMED_BANK_ORDER_KEY)
}