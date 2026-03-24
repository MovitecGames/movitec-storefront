"use client"

import { create } from "zustand"

export type CartItem = {
  id: string
  title: string
  price: number
  quantity: number
}

type CartStore = {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (id: string) => void
  increaseQuantity: (id: string) => void
  decreaseQuantity: (id: string) => void
  clearCart: () => void
  getTotal: () => number
  getItemsCount: () => number
}

export const useCart = create<CartStore>((set, get) => ({
  items: [],

  addItem: (item) => {
    const existing = get().items.find((i) => i.id === item.id)

    if (existing) {
      set({
        items: get().items.map((i) =>
          i.id === item.id
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        ),
      })
    } else {
      set({
        items: [...get().items, item],
      })
    }
  },

  removeItem: (id) => {
    set({
      items: get().items.filter((i) => i.id !== id),
    })
  },

  increaseQuantity: (id) => {
    set({
      items: get().items.map((i) =>
        i.id === id ? { ...i, quantity: i.quantity + 1 } : i
      ),
    })
  },

  decreaseQuantity: (id) => {
    set({
      items: get()
        .items.map((i) =>
          i.id === id ? { ...i, quantity: i.quantity - 1 } : i
        )
        .filter((i) => i.quantity > 0),
    })
  },

  clearCart: () => set({ items: [] }),

  getTotal: () => {
    return get().items.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0
    )
  },

  getItemsCount: () => {
    return get().items.reduce((acc, item) => acc + item.quantity, 0)
  },
}))
