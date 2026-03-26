"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { medusa } from "../../../lib/medusa"
import {
  createCart,
  createLineItem,
  retrieveCart,
  transferCart,
} from "../../../lib/medusa-cart"
import { getStoredCartId, setStoredCartId } from "../../../lib/cart-storage"

type ProductImage = {
  url?: string | null
}

type ProductVariant = {
  id: string
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

type ProductItem = {
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

type CartResponse = {
  id: string
  items?: CartItem[]
}

export default function ProductPage({
  params,
}: {
  params: Promise<{ handle: string }>
}) {
  const [product, setProduct] = useState<ProductItem | null>(null)
  const [customer, setCustomer] = useState<CustomerItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [cartCount, setCartCount] = useState(0)
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      try {
        const resolvedParams = await params

        const productPromise = medusa.store.product.list({
          handle: resolvedParams.handle,
          country_code: "co",
          fields: "*variants.calculated_price,+images,+variants.metadata",
        })

        const customerPromise = medusa.store.customer
          .retrieve()
          .then(({ customer }) => customer)
          .catch(() => null)

        const [productResponse, currentCustomer] = await Promise.all([
          productPromise,
          customerPromise,
        ])

        setProduct(productResponse.products?.[0] || null)
        setCustomer(currentCustomer)

        const storedCartId = getStoredCartId()

        if (storedCartId) {
          try {
            if (currentCustomer) {
              await transferCart(storedCartId).catch(() => null)
            }

            const { cart } = await retrieveCart(storedCartId)
            const count =
              cart.items?.reduce(
                (acc: number, item: CartItem) => acc + (item.quantity || 0),
                0
              ) || 0

            setCartCount(count)
          } catch (error) {
            console.error(error)
          }
        }
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [params])

  if (loading) {
    return (
      <main className="min-h-screen bg-neutral-50 p-10 text-slate-900">
        <p>Cargando producto…</p>
      </main>
    )
  }

  if (!product) {
    return (
      <main className="min-h-screen bg-neutral-50 p-10 text-slate-900">
        <p>Producto no encontrado.</p>
      </main>
    )
  }

  const isApproved = customer?.metadata?.approved === true
  const image = product.thumbnail || product.images?.[0]?.url || null
  const variant = product.variants?.[0]
  const price = variant?.calculated_price?.calculated_amount || 0
  const currency =
    variant?.calculated_price?.currency_code?.toUpperCase() || "COP"

  const increaseLocalQuantity = () => setQuantity((prev) => prev + 1)
  const decreaseLocalQuantity = () =>
    setQuantity((prev) => (prev > 1 ? prev - 1 : 1))

  const handleAddToCart = async () => {
    try {
      if (!variant?.id) {
        alert("Este producto no tiene una variante válida para compra.")
        return
      }

      setAdding(true)

      let cartId = getStoredCartId()

      if (!cartId) {
        const created = await createCart()
        const newCartId = created?.cart?.id

        if (!newCartId) {
          alert("No fue posible crear el carrito.")
          return
        }

        setStoredCartId(newCartId)
        cartId = newCartId
      } else {
        try {
          await retrieveCart(cartId)
        } catch {
          const created = await createCart()
          const newCartId = created?.cart?.id

          if (!newCartId) {
            alert("No fue posible crear el carrito.")
            return
          }

          setStoredCartId(newCartId)
          cartId = newCartId
        }
      }

      if (customer && cartId) {
        await transferCart(cartId).catch(() => null)
      }

      if (!cartId) {
        alert("No fue posible identificar un carrito válido.")
        return
      }

      const { cart: updatedCart } = await createLineItem(cartId, {
        variant_id: variant.id,
        quantity,
        metadata: {
          weight_g: variant.metadata?.weight_g ?? "",
          width_cm: variant.metadata?.width_cm ?? "",
          height_cm: variant.metadata?.height_cm ?? "",
          length_cm: variant.metadata?.length_cm ?? "",
        },
      })

      const count =
        updatedCart.items?.reduce(
          (acc: number, item: CartItem) => acc + (item.quantity || 0),
          0
        ) || 0

      setCartCount(count)
      alert("Producto agregado al carrito.")
    } catch (error) {
      console.error(error)
      alert("No fue posible agregar el producto al carrito.")
    } finally {
      setAdding(false)
    }
  }

  return (
    <main className="min-h-screen bg-neutral-50 text-slate-900">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-6 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex text-sm font-medium text-slate-500 hover:text-slate-900"
          >
            ← Volver al catálogo
          </Link>

          <Link
            href="/carrito"
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            🛒 Carrito ({cartCount})
          </Link>
        </div>

        <div className="grid gap-10 lg:grid-cols-2">
          <div className="overflow-hidden rounded-3xl bg-slate-100">
            {image ? (
              <img
                src={image}
                alt={product.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex aspect-square items-center justify-center text-slate-400">
                Sin imagen
              </div>
            )}
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
              Producto
            </p>

            <h1 className="mt-2 text-4xl font-bold tracking-tight">
              {product.title}
            </h1>

            {product.subtitle ? (
              <p className="mt-3 text-lg text-slate-600">{product.subtitle}</p>
            ) : null}

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
                <h2 className="text-lg font-semibold">Descripción</h2>
                <p className="mt-2 whitespace-pre-line text-slate-600">
                  {product.description}
                </p>
              </div>
            ) : null}

            {customer && isApproved && (
              <div className="mt-8 space-y-4">
                <div>
                  <p className="mb-2 text-sm font-semibold text-slate-700">
                    Cantidad
                  </p>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={decreaseLocalQuantity}
                      className="h-10 w-10 rounded-xl border border-slate-300 text-lg font-bold text-slate-700 hover:bg-slate-50"
                    >
                      -
                    </button>

                    <div className="flex h-10 min-w-[56px] items-center justify-center rounded-xl border border-slate-300 px-4 font-semibold">
                      {quantity}
                    </div>

                    <button
                      onClick={increaseLocalQuantity}
                      className="h-10 w-10 rounded-xl border border-slate-300 text-lg font-bold text-slate-700 hover:bg-slate-50"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleAddToCart}
                    disabled={adding}
                    className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                  >
                    {adding ? "Agregando..." : "Agregar al carrito"}
                  </button>

                  <Link
                    href="/carrito"
                    className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Ver carrito
                  </Link>
                </div>
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
                  final, puedes consultar este producto a través de tiendas
                  aliadas o del canal retail.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <a
                    href="https://tiendamovitec.com"
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
                  >
                    Ir a canal retail
                  </a>

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
              Producto disponible para canal B2B Movitec Games.
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}