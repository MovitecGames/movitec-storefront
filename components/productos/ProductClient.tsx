"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { medusa } from "../../lib/medusa"
import {
  createCart,
  createLineItem,
  retrieveCart,
} from "../../lib/medusa-cart"
import {
  getStoredCartId,
  setStoredCartId,
  clearStoredCheckoutState,
} from "../../lib/cart-storage"

type ProductImage = {
  url?: string | null
}

type ProductVariant = {
  id: string
  inventory_quantity?: number | null
  manage_inventory?: boolean | null
  allow_backorder?: boolean | null
  calculated_price?: {
    calculated_amount?: number
    currency_code?: string
  }
  metadata?: {
    weight_g?: string | number
    width_cm?: string | number
    height_cm?: string | number
    length_cm?: string | number
    [key: string]: any
  } | null
}

export type ProductItem = {
  id: string
  title: string
  subtitle?: string | null
  description?: string | null
  thumbnail?: string | null
  images?: ProductImage[]
  variants?: ProductVariant[]
}

type CustomerItem = {
  email?: string
  metadata?: {
    approved?: boolean
  } | null
}

type CartItem = {
  quantity?: number
}

type CatalogReturnState = {
  pathname: "/productos"
  searchQuery: string
  selectedEditorial: string
  selectedTag: string
  scrollY: number
}

const CATALOG_RETURN_STATE_KEY = "movitec_catalog_return_state"

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  return String(error || "")
}

function isCompletedCartError(error: unknown) {
  return getErrorMessage(error).toLowerCase().includes("already completed")
}

function isInventoryError(error: unknown) {
  const message = getErrorMessage(error).toLowerCase()

  return (
    message.includes("required inventory") ||
    message.includes("does not have the required inventory") ||
    message.includes("insufficient inventory") ||
    message.includes("not enough inventory") ||
    message.includes("out of stock")
  )
}

function clearStoredCartState() {
  clearStoredCheckoutState()
}

function getVariantInventoryQuantity(variant?: ProductVariant) {
  if (!variant) return null

  if (typeof variant.inventory_quantity === "number") {
    return variant.inventory_quantity
  }

  return null
}

function getStockStatus(variant?: ProductVariant) {
  const inventoryQuantity = getVariantInventoryQuantity(variant)

  if (inventoryQuantity === null) {
    return {
      label: "Disponible",
      helperText: "Producto disponible para canal B2B Movitec Games.",
      className: "border-emerald-200 bg-emerald-50 text-emerald-700",
      isSoldOut: false,
      inventoryQuantity,
    }
  }

  if (inventoryQuantity <= 0) {
    return {
      label: "Agotado temporalmente",
      helperText:
        "Este título hace parte de nuestro catálogo activo y pronto volverá a estar disponible para pedidos comerciales.",
      className: "border-slate-300 bg-slate-100 text-slate-600",
      isSoldOut: true,
      inventoryQuantity,
    }
  }

  if (inventoryQuantity <= 5) {
    return {
      label: "Pocas unidades",
      helperText: "Quedan pocas unidades disponibles para pedido inmediato.",
      className: "border-amber-200 bg-amber-50 text-amber-700",
      isSoldOut: false,
      inventoryQuantity,
    }
  }

  return {
    label: "Disponible",
    helperText: "Producto disponible para pedido inmediato.",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    isSoldOut: false,
    inventoryQuantity,
  }
}

export default function ProductClient({
  initialProduct,
}: {
  initialProduct: ProductItem
}) {
  const router = useRouter()

  const [product] = useState<ProductItem>(initialProduct)
  const [customer, setCustomer] = useState<CustomerItem | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [cartCount, setCartCount] = useState(0)
  const [adding, setAdding] = useState(false)

  const handleBackToCatalog = () => {
    try {
      const storedState = window.sessionStorage.getItem(
        CATALOG_RETURN_STATE_KEY
      )

      if (storedState) {
        const parsedState = JSON.parse(storedState) as CatalogReturnState

        if (parsedState.pathname === "/productos") {
          router.push("/productos")
          return
        }
      }
    } catch (error) {
      console.error("Error recuperando el origen del catálogo:", error)
      window.sessionStorage.removeItem(CATALOG_RETURN_STATE_KEY)
    }

    try {
      const referrer = document.referrer

      if (referrer) {
        const referrerUrl = new URL(referrer)

        if (referrerUrl.origin === window.location.origin) {
          router.back()
          return
        }
      }
    } catch (error) {
      console.error("Error validando la página anterior:", error)
    }

    router.push("/productos")
  }

  const syncCartCount = async (cartId: string) => {
    try {
      const { cart } = await retrieveCart(cartId)

      const count =
        cart.items?.reduce(
          (acc: number, item: CartItem) => acc + (item.quantity || 0),
          0
        ) || 0

      setCartCount(count)
      return cart
    } catch (error) {
      console.error(error)

      if (isCompletedCartError(error)) {
        clearStoredCartState()
        setCartCount(0)
      }

      return null
    }
  }

  useEffect(() => {
    const loadCustomerAndCart = async () => {
      try {
        const currentCustomer = await medusa.store.customer
          .retrieve()
          .then(({ customer }) => customer)
          .catch(() => null)

        setCustomer(currentCustomer)

        const storedCartId = getStoredCartId()

        if (storedCartId) {
          await syncCartCount(storedCartId)
        } else {
          setCartCount(0)
        }
      } catch (error) {
        console.error(error)
      }
    }

    loadCustomerAndCart()
  }, [])

  const ensureValidCartId = async () => {
    let cartId = getStoredCartId()

    if (!cartId) {
      const created = await createCart()
      const newCartId = created?.cart?.id

      if (!newCartId) {
        throw new Error("No fue posible crear el carrito.")
      }

      setStoredCartId(newCartId)
      setCartCount(0)
      return newCartId
    }

    try {
      await retrieveCart(cartId)
      return cartId
    } catch (error) {
      const message = getErrorMessage(error).toLowerCase()

      if (message.includes("already completed")) {
        clearStoredCartState()
      }

      const created = await createCart()
      const newCartId = created?.cart?.id

      if (!newCartId) {
        throw new Error("No fue posible crear un carrito nuevo.")
      }

      setStoredCartId(newCartId)
      setCartCount(0)
      return newCartId
    }
  }

  const isApproved = customer?.metadata?.approved === true
  const image = product.thumbnail || product.images?.[0]?.url || null
  const variant = product.variants?.[0]
  const price = variant?.calculated_price?.calculated_amount || 0
  const currency =
    variant?.calculated_price?.currency_code?.toUpperCase() || "COP"
  const stockStatus = getStockStatus(variant)

  const increaseLocalQuantity = () =>
    setQuantity((prev) => {
      if (
        typeof stockStatus.inventoryQuantity === "number" &&
        prev >= stockStatus.inventoryQuantity
      ) {
        return prev
      }

      return prev + 1
    })

  const decreaseLocalQuantity = () =>
    setQuantity((prev) => (prev > 1 ? prev - 1 : 1))

  const handleAddToCart = async () => {
    try {
      if (!variant?.id) {
        alert("Este producto no tiene una variante válida para compra.")
        return
      }

      if (stockStatus.isSoldOut) {
        alert(
          "Este producto está agotado temporalmente. Hace parte de nuestro catálogo activo y pronto volverá a estar disponible."
        )
        return
      }

      if (
        typeof stockStatus.inventoryQuantity === "number" &&
        quantity > stockStatus.inventoryQuantity
      ) {
        alert(
          "La cantidad solicitada supera las unidades disponibles para pedido inmediato. Reduce la cantidad o consulta disponibilidad con Movitec Games."
        )
        return
      }

      setAdding(true)

      let cartId = await ensureValidCartId()

      try {
        const { cart: updatedCart } = await createLineItem(cartId, {
          variant_id: variant.id,
          quantity,
        })

        const count =
          updatedCart.items?.reduce(
            (acc: number, item: CartItem) => acc + (item.quantity || 0),
            0
          ) || 0

        setCartCount(count)
        alert("Producto agregado al carrito.")
      } catch (error) {
        if (isCompletedCartError(error)) {
          clearStoredCartState()
          setCartCount(0)

          cartId = await ensureValidCartId()

          const { cart: updatedCart } = await createLineItem(cartId, {
            variant_id: variant.id,
            quantity,
          })

          const count =
            updatedCart.items?.reduce(
              (acc: number, item: CartItem) => acc + (item.quantity || 0),
              0
            ) || 0

          setCartCount(count)
          alert("Producto agregado al carrito.")
          return
        }

        throw error
      }
    } catch (error) {
      console.error("ERROR AGREGANDO AL CARRITO:", error)

      if (isInventoryError(error)) {
        alert(
          "Este producto está agotado temporalmente o no cuenta con unidades suficientes para la cantidad solicitada. Pronto volverá a estar disponible."
        )
        return
      }

      alert("No fue posible agregar el producto al carrito.")
    } finally {
      setAdding(false)
    }
  }

  return (
    <main className="min-h-screen bg-neutral-50 text-slate-900">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-6 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={handleBackToCatalog}
            className="inline-flex text-sm font-medium text-slate-500 hover:text-slate-900"
          >
            ← Volver al catálogo
          </button>

          <Link
            href="/carrito"
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            🛒 Carrito ({cartCount})
          </Link>
        </div>

        <div className="grid gap-10 lg:grid-cols-2">
          <div className="relative overflow-hidden rounded-3xl bg-slate-100">
            {image ? (
              <img
                src={image}
                alt={`${product.title} juego de mesa moderno en Colombia`}
                className={`h-full w-full object-cover ${
                  stockStatus.isSoldOut ? "opacity-60 grayscale" : ""
                }`}
              />
            ) : (
              <div className="flex aspect-square items-center justify-center text-slate-400">
                Sin imagen
              </div>
            )}

            <div className="absolute left-4 top-4">
              <span
                className={`rounded-full border px-3 py-1 text-xs font-bold shadow-sm ${stockStatus.className}`}
              >
                {stockStatus.label}
              </span>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
              Juego de mesa moderno · Catálogo B2B Colombia
            </p>

            <h1 className="mt-2 text-4xl font-bold tracking-tight">
              {product.title}
            </h1>

            {product.subtitle ? (
              <p className="mt-3 text-lg text-slate-600">
                {product.subtitle}
              </p>
            ) : null}

            <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
              <span
                className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${stockStatus.className}`}
              >
                {stockStatus.label}
              </span>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                {stockStatus.helperText}
              </p>
            </div>

            <div className="mt-6">
              {customer && isApproved ? (
                <p className="text-3xl font-bold">
                  {new Intl.NumberFormat("es-CO", {
                    style: "currency",
                    currency,
                    maximumFractionDigits: 0,
                  }).format(price)}
                </p>
              ) : (
                <p className="text-base font-medium text-slate-500">
                  Precio disponible para clientes autorizados
                </p>
              )}
            </div>

            {product.description ? (
              <div className="mt-8">
                <h2 className="text-lg font-semibold">
                  Descripción de {product.title}
                </h2>

                <p className="mt-2 whitespace-pre-line text-slate-600">
                  {product.description}
                </p>
              </div>
            ) : (
              <div className="mt-8">
                <h2 className="text-lg font-semibold">
                  {product.title} en Movitec Games
                </h2>

                <p className="mt-2 text-slate-600">
                  {product.title} hace parte del catálogo B2B de Movitec Games,
                  distribuidor de juegos de mesa modernos en español para
                  tiendas, librerías, clubes y comercios especializados en
                  Colombia.
                </p>
              </div>
            )}

            {customer && isApproved && (
              <div className="mt-8 space-y-4">
                <div>
                  <p className="mb-2 text-sm font-semibold text-slate-700">
                    Cantidad
                  </p>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={decreaseLocalQuantity}
                      disabled={stockStatus.isSoldOut}
                      className="h-10 w-10 rounded-xl border border-slate-300 text-lg font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      -
                    </button>

                    <div className="flex h-10 min-w-[56px] items-center justify-center rounded-xl border border-slate-300 px-4 font-semibold">
                      {quantity}
                    </div>

                    <button
                      onClick={increaseLocalQuantity}
                      disabled={
                        stockStatus.isSoldOut ||
                        (typeof stockStatus.inventoryQuantity === "number" &&
                          quantity >= stockStatus.inventoryQuantity)
                      }
                      className="h-10 w-10 rounded-xl border border-slate-300 text-lg font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleAddToCart}
                    disabled={adding || stockStatus.isSoldOut}
                    className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {adding
                      ? "Agregando..."
                      : stockStatus.isSoldOut
                        ? "Agotado temporalmente"
                        : "Agregar al carrito"}
                  </button>

                  <Link
                    href="/carrito"
                    className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Ver carrito
                  </Link>
                </div>

                {stockStatus.isSoldOut && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-800">
                      Producto agotado temporalmente
                    </p>

                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Este título hace parte de nuestro catálogo activo. Pronto
                      volverá a estar disponible para pedidos comerciales.
                    </p>
                  </div>
                )}
              </div>
            )}

            {!customer && (
              <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-6">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Público general
                </p>

                <h2 className="mt-3 text-xl font-bold tracking-tight">
                  ¿Te interesa este juego?
                </h2>

                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Este sitio está orientado al canal comercial. Si eres cliente
                  final, puedes consultar este producto en los puntos de venta,
                  tiendas aliadas o canales retail disponibles.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href="/donde-comprar"
                    className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
                  >
                    Dónde comprar
                  </Link>

                  <Link
                    href="/solicitar-acceso"
                    className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Solicitar acceso comercial
                  </Link>
                </div>
              </div>
            )}

            {customer && !isApproved && (
              <div className="mt-10 rounded-2xl border border-amber-200 bg-amber-50 p-6">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-700">
                  Cuenta en revisión
                </p>

                <h2 className="mt-3 text-xl font-bold tracking-tight text-amber-900">
                  Tu perfil comercial aún no está aprobado
                </h2>

                <p className="mt-3 text-sm leading-6 text-amber-900/80">
                  Ya registramos tu solicitud. Una vez validemos tu
                  documentación, se habilitarán precios y condiciones B2B para
                  este producto.
                </p>
              </div>
            )}

            {customer && isApproved && (
              <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-6">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Cliente autorizado
                </p>

                <h2 className="mt-3 text-xl font-bold tracking-tight">
                  Acceso comercial habilitado
                </h2>

                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Tu cuenta ya tiene acceso comercial. Ya puedes ir construyendo
                  tu pedido desde el carrito B2B.
                </p>
              </div>
            )}

            <div className="mt-6 text-xs text-slate-500">
              Producto disponible para canal B2B Movitec Games, distribuidor de
              juegos de mesa modernos en Colombia.
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}