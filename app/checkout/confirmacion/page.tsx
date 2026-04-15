"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { medusa } from "../../../lib/medusa"
import { retrieveCart, transferCart } from "../../../lib/medusa-cart"
import { getStoredCartId } from "../../../lib/cart-storage"

type CartLineItem = {
  id: string
  title?: string
  quantity?: number
  unit_price?: number
}

type CartAddress = {
  first_name?: string
  last_name?: string
  company?: string
  address_1?: string
  city?: string
  province?: string
  postal_code?: string
  country_code?: string
  phone?: string
}

type CartType = {
  id: string
  currency_code?: string
  email?: string
  items?: CartLineItem[]
  metadata?: Record<string, any> | null
  shipping_address?: CartAddress | null
  billing_address?: CartAddress | null
}

type CustomerItem = {
  email?: string
  first_name?: string
  last_name?: string
  metadata?: {
    approved?: boolean
    [key: string]: any
  } | null
}

type ConfirmedOrder = {
  id: string
  display_id: number | string
  public_order_number: string
  source_cart_id?: string
  email: string
  total: number
  currency_code: string
  summary?: {
    total_pvp?: number
    commercial_label?: string
    commercial_value?: number
    total_with_commercial_terms?: number
    shipping_cost?: number
    retefuente_value?: number
    ica_value?: number
    payment_fee?: number
  }
  customer?: {
    name?: string
    company?: string
    phone?: string
    email?: string
  }
  delivery?: {
    mode?: string
    instructions?: string
    address?: string
    city?: string
    province?: string
    postal_code?: string
    shipping_label?: string
  }
  items?: Array<{
    title: string
    quantity: number
    unit_price: number
    subtotal?: number
  }>
}

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value)
}

function normalizeWhitespace(value: string) {
  return String(value || "").replace(/\s+/g, " ").trim()
}

function buildFallbackOrderNumber(cart: CartType | null) {
  if (!cart?.id) return "ORD-PENDIENTE"

  const suffix = cart.id.replace(/[^a-zA-Z0-9]/g, "").slice(-8).toUpperCase()
  return `ORD-${suffix || "PENDIENTE"}`
}

function getNumber(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export default function CheckoutConfirmationPage() {
  const [cart, setCart] = useState<CartType | null>(null)
  const [customer, setCustomer] = useState<CustomerItem | null>(null)
  const [confirmedOrder, setConfirmedOrder] = useState<ConfirmedOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [purchaseCommitted, setPurchaseCommitted] = useState(false)
  const [confirmingOrder, setConfirmingOrder] = useState(false)

  const loadData = async () => {
    try {
      const cartId = getStoredCartId()

      if (typeof window !== "undefined") {
        const storedConfirmedOrder = sessionStorage.getItem("last_confirmed_order")

        if (storedConfirmedOrder) {
          const parsed = JSON.parse(storedConfirmedOrder) as ConfirmedOrder

          if (parsed?.source_cart_id && cartId && parsed.source_cart_id === cartId) {
            setConfirmedOrder(parsed)
            setCart(null)
            return
          }

          if (!cartId) {
            setConfirmedOrder(parsed)
            return
          }

          sessionStorage.removeItem("last_confirmed_order")
        }
      }

      if (!cartId) {
        setCart(null)
        return
      }

      const { customer } = await medusa.store.customer
        .retrieve()
        .catch(() => ({ customer: null }))

      setCustomer(customer)

      if (customer) {
        await transferCart(cartId).catch(() => null)
      }

      const { cart } = await retrieveCart(cartId)
      setCart(cart as CartType)
    } catch (error) {
      console.error(error)
      setCart(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleConfirmOrder = async () => {
    try {
      const cartId = getStoredCartId()

      if (!cartId) {
        alert("No se encontró un carrito activo.")
        return
      }

      if (!purchaseCommitted) {
        alert("Debes confirmar el compromiso de compra antes de continuar.")
        return
      }

      if (confirmingOrder) return

      setConfirmingOrder(true)

      const response = await fetch("/api/b2b/confirm-bank-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cartId }),
      })

      const data = await response.json().catch(() => null)

      if (!response.ok || !data?.ok || !data?.order) {
        alert(
          data?.error || "No fue posible confirmar el pedido y reservar inventario."
        )
        return
      }

      if (typeof window !== "undefined") {
        sessionStorage.setItem("last_confirmed_order", JSON.stringify(data.order))
        localStorage.removeItem("medusa_cart_id")
      }

      setConfirmedOrder(data.order as ConfirmedOrder)
      setCart(null)
      setPurchaseCommitted(false)
    } catch (error) {
      console.error("[CHECKOUT_CONFIRM_ORDER] unexpected error", error)
      alert("Ocurrió un error confirmando el pedido.")
    } finally {
      setConfirmingOrder(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-neutral-50 text-slate-900">
        <div className="mx-auto max-w-5xl px-6 py-10">
          <p className="text-sm text-slate-500">Cargando confirmación…</p>
        </div>
      </main>
    )
  }

  if (confirmedOrder) {
    const confirmedCurrency = confirmedOrder.currency_code?.toUpperCase() || "COP"
    const summary = confirmedOrder.summary || {}
    const confirmedCustomer = confirmedOrder.customer || {}
    const delivery = confirmedOrder.delivery || {}
    const confirmedItems = confirmedOrder.items || []

    return (
      <main className="min-h-screen bg-neutral-50 text-slate-900">
        <div className="mx-auto max-w-5xl px-6 py-10">
          <div className="mb-6 flex items-center justify-between gap-4">
            <Link
              href="/"
              className="text-sm font-medium text-slate-500 hover:text-slate-900"
            >
              ← Volver al catálogo
            </Link>
          </div>

          <div className="rounded-3xl border border-emerald-200 bg-white p-8 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-700">
              Pedido confirmado
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight">
              Instrucciones de pago
            </h1>

            <p className="mt-3 max-w-3xl text-sm text-slate-600">
              Tu pedido ya fue confirmado en Medusa. Usa este número oficial como
              referencia para el pago y el seguimiento.
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-5">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                  Número oficial del pedido
                </p>
                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {confirmedOrder.public_order_number}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-5">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                  Total a pagar
                </p>
                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {formatMoney(confirmedOrder.total || 0, confirmedCurrency)}
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">
              Al confirmar este pedido, declaraste una intención real y seria de
              compra. Las unidades quedaron reservadas temporalmente y dejaron de
              estar disponibles para otros clientes mientras se valida el pago.
              El pago y el envío del soporte deben realizarse dentro de las{" "}
              <strong>24 horas siguientes</strong>. Si no se recibe o valida el
              pago en ese plazo, la reserva podrá dejarse sin efecto y las
              unidades podrán volver a quedar disponibles para la venta.
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-6">
              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-bold">Datos para transferencia</h2>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 md:col-span-2">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                      Opción 1
                    </p>
                    <p className="mt-1 text-lg font-bold text-slate-900">
                      Banco ITAÚ
                    </p>

                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <div>
                        <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                          Titular
                        </p>
                        <p className="mt-1 font-semibold text-slate-900">
                          Comercializadora AETOS SAS
                        </p>
                      </div>

                      <div>
                        <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                          Tipo de cuenta
                        </p>
                        <p className="mt-1 font-semibold text-slate-900">
                          Cuenta de Ahorros
                        </p>
                      </div>

                      <div>
                        <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                          Número de cuenta
                        </p>
                        <p className="mt-1 font-semibold text-slate-900">
                          213 186 906
                        </p>
                      </div>

                      <div>
                        <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                          NIT
                        </p>
                        <p className="mt-1 font-semibold text-slate-900">
                          900.197.911-5
                        </p>
                      </div>

                      <div className="md:col-span-2 rounded-2xl bg-emerald-50 p-4">
                        <p className="text-xs uppercase tracking-[0.16em] text-emerald-700">
                          Llave Bre-B
                        </p>
                        <p className="mt-1 text-base font-semibold text-emerald-900">
                          0090218528
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 md:col-span-2">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                      Opción 2
                    </p>
                    <p className="mt-1 text-lg font-bold text-slate-900">
                      Banco Bancolombia
                    </p>

                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <div>
                        <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                          Titular
                        </p>
                        <p className="mt-1 font-semibold text-slate-900">
                          Comercializadora AETOS SAS
                        </p>
                      </div>

                      <div>
                        <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                          Tipo de cuenta
                        </p>
                        <p className="mt-1 font-semibold text-slate-900">
                          Cuenta de Ahorros
                        </p>
                      </div>

                      <div>
                        <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                          Número de cuenta
                        </p>
                        <p className="mt-1 font-semibold text-slate-900">
                          688-000082-53
                        </p>
                      </div>

                      <div>
                        <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                          NIT
                        </p>
                        <p className="mt-1 font-semibold text-slate-900">
                          900.197.911-5
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">
                  Realiza el pago por el valor exacto del pedido y usa como
                  referencia interna <strong>{confirmedOrder.public_order_number}</strong>.
                  El soporte debe enviarse dentro de las{" "}
                  <strong>24 horas siguientes</strong>.
                </div>
              </section>

              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-bold">Envío del soporte</h2>

                <div className="mt-4 space-y-3 text-sm text-slate-700">
                  <p>
                    <span className="font-semibold text-slate-900">Correo:</span>{" "}
                    ventas@movitecgames.com
                  </p>
                  <p>
                    <span className="font-semibold text-slate-900">
                      Asunto del correo:
                    </span>{" "}
                    {confirmedOrder.public_order_number}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-900">
                      Instrucción:
                    </span>{" "}
                    Adjunta el soporte de pago y usa en el asunto el número del
                    pedido para facilitar la validación.
                  </p>
                </div>

                <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-xs leading-6 text-slate-500">
                  Envía el soporte de pago a <strong>ventas@movitecgames.com</strong>{" "}
                  dentro de las <strong>24 horas siguientes</strong> a la
                  confirmación del pedido, usando como asunto el número oficial
                  de la orden. Una vez se verifique el pago, se continuará con
                  el alistamiento y la coordinación de entrega.
                </div>
              </section>

              {!!confirmedItems.length && (
                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-xl font-bold">Resumen del pedido</h2>

                  <div className="mt-5 space-y-3">
                    {confirmedItems.map((item, index) => {
                      const subtotal =
                        item.subtotal ??
                        Number(item.unit_price || 0) * Number(item.quantity || 0)

                      return (
                        <div
                          key={`${item.title}-${index}`}
                          className="rounded-2xl bg-slate-50 p-4"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="font-semibold text-slate-900">
                                {item.title || "Producto"}
                              </p>
                              <p className="mt-1 text-sm text-slate-600">
                                Cantidad: {item.quantity || 0}
                              </p>
                              <p className="text-sm text-slate-600">
                                Precio unitario:{" "}
                                {formatMoney(
                                  Number(item.unit_price || 0),
                                  confirmedCurrency
                                )}
                              </p>
                            </div>

                            <p className="text-sm font-bold text-slate-900">
                              {formatMoney(subtotal, confirmedCurrency)}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </section>
              )}
            </div>

            <aside className="space-y-6">
              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-bold">Resumen financiero</h2>

                <div className="mt-5 space-y-3 text-sm">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Total PVP</span>
                    <span>
                      {formatMoney(Number(summary.total_pvp || 0), confirmedCurrency)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span>{summary.commercial_label || "Condición comercial"}</span>
                    <span>
                      -{" "}
                      {formatMoney(
                        Number(summary.commercial_value || 0),
                        confirmedCurrency
                      )}
                    </span>
                  </div>

                  <div className="flex items-center justify-between font-semibold text-slate-900">
                    <span>Total con condición comercial</span>
                    <span>
                      {formatMoney(
                        Number(summary.total_with_commercial_terms || 0),
                        confirmedCurrency
                      )}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span>Envío</span>
                    <span>
                      {formatMoney(Number(summary.shipping_cost || 0), confirmedCurrency)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span>Retefuente</span>
                    <span>
                      -{" "}
                      {formatMoney(
                        Number(summary.retefuente_value || 0),
                        confirmedCurrency
                      )}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span>ICA</span>
                    <span>
                      -{" "}
                      {formatMoney(Number(summary.ica_value || 0), confirmedCurrency)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span>Costo adicional por pago</span>
                    <span>
                      {formatMoney(Number(summary.payment_fee || 0), confirmedCurrency)}
                    </span>
                  </div>

                  <hr className="my-2 border-slate-200" />

                  <div className="flex items-center justify-between text-lg font-bold text-slate-900">
                    <span>Total a pagar</span>
                    <span>
                      {formatMoney(Number(confirmedOrder.total || 0), confirmedCurrency)}
                    </span>
                  </div>
                </div>
              </section>

              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-bold">Datos del cliente</h2>

                <div className="mt-4 space-y-3 text-sm text-slate-700">
                  <p>
                    <span className="font-semibold text-slate-900">Nombre:</span>{" "}
                    {confirmedCustomer.name || "No registrado"}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-900">Empresa:</span>{" "}
                    {confirmedCustomer.company || "No registrada"}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-900">Correo:</span>{" "}
                    {confirmedCustomer.email || confirmedOrder.email || "No registrado"}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-900">Teléfono:</span>{" "}
                    {confirmedCustomer.phone || "No registrado"}
                  </p>
                </div>
              </section>

              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-bold">Entrega</h2>

                <div className="mt-4 space-y-3 text-sm text-slate-700">
                  <p>
                    <span className="font-semibold text-slate-900">Modalidad:</span>{" "}
                    {delivery.mode === "pickup"
                      ? "Recoger en bodega"
                      : delivery.mode === "bogota"
                      ? "Entrega en Bogotá"
                      : delivery.mode === "nacional"
                      ? "Envío nacional"
                      : "No registrada"}
                  </p>

                  {delivery.mode === "pickup" ? (
                    <p>
                      <span className="font-semibold text-slate-900">
                        Instrucciones:
                      </span>{" "}
                      {delivery.instructions || "Sin instrucciones adicionales"}
                    </p>
                  ) : (
                    <>
                      <p>
                        <span className="font-semibold text-slate-900">
                          Dirección:
                        </span>{" "}
                        {delivery.address || "No registrada"}
                      </p>
                      <p>
                        <span className="font-semibold text-slate-900">Ciudad:</span>{" "}
                        {delivery.city || "No registrada"}
                      </p>
                      <p>
                        <span className="font-semibold text-slate-900">
                          Departamento:
                        </span>{" "}
                        {delivery.province || "No registrado"}
                      </p>
                      <p>
                        <span className="font-semibold text-slate-900">
                          Código postal:
                        </span>{" "}
                        {delivery.postal_code || "No registrado"}
                      </p>
                    </>
                  )}

                  {delivery.mode === "nacional" && delivery.shipping_label && (
                    <p>
                      <span className="font-semibold text-slate-900">Servicio:</span>{" "}
                      {delivery.shipping_label}
                    </p>
                  )}
                </div>
              </section>
            </aside>
          </div>
        </div>
      </main>
    )
  }

  const items = cart?.items || []
  const currency = cart?.currency_code?.toUpperCase() || "COP"
  const metadata = cart?.metadata || {}

  const orderNumber =
    normalizeWhitespace(String(metadata.checkout_order_number || "")) ||
    normalizeWhitespace(String(metadata.order_number || "")) ||
    buildFallbackOrderNumber(cart)

  const totalPvp = getNumber(metadata.checkout_total_pvp ?? metadata.cart_total_pvp)
  const commercialLabel = String(
    metadata.checkout_commercial_label ??
      metadata.cart_commercial_label ??
      "Condición comercial"
  )
  const commercialValue = getNumber(
    metadata.checkout_commercial_value ?? metadata.cart_commercial_value
  )
  const totalWithCommercialTerms = getNumber(
    metadata.checkout_total_with_commercial_terms ??
      metadata.cart_total_with_commercial_terms
  )
  const shippingCost = getNumber(
    metadata.checkout_shipping_cost ?? metadata.selected_shipping_price
  )
  const paymentFee = getNumber(
    metadata.checkout_payment_fee ?? metadata.payment_fee_value
  )
  const retefuenteValue = getNumber(
    metadata.checkout_retefuente_value ?? metadata.retefuente_value
  )
  const icaValue = getNumber(metadata.checkout_ica_value ?? metadata.ica_value)
  const finalTotal = getNumber(
    metadata.checkout_final_total ??
      metadata.cart_final_payable_total ??
      (totalWithCommercialTerms +
        shippingCost -
        retefuenteValue -
        icaValue +
        paymentFee)
  )

  const customerName = [
    cart?.shipping_address?.first_name || customer?.first_name || "",
    cart?.shipping_address?.last_name || customer?.last_name || "",
  ]
    .filter(Boolean)
    .join(" ")

  const deliveryMode = String(metadata.delivery_mode || "pickup")
  const pickupInstructions = String(metadata.pickup_instructions || "")
  const selectedShippingLabel = String(metadata.selected_shipping_label || "")

  if (!cart) {
    return (
      <main className="min-h-screen bg-neutral-50 text-slate-900">
        <div className="mx-auto max-w-5xl px-6 py-10">
          <h1 className="text-3xl font-bold">Confirmación de pedido</h1>
          <p className="mt-3 text-slate-600">
            No se encontró un carrito activo para mostrar la confirmación.
          </p>

          <Link
            href="/"
            className="mt-6 inline-flex rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white"
          >
            Volver al catálogo
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-neutral-50 text-slate-900">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-6 flex items-center justify-between gap-4">
          <Link
            href="/checkout"
            className="text-sm font-medium text-slate-500 hover:text-slate-900"
          >
            ← Volver al checkout
          </Link>
        </div>

        <div className="rounded-3xl border border-emerald-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-700">
            Confirmación final
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            Confirmar pedido y reservar inventario
          </h1>

          <p className="mt-3 max-w-3xl text-sm text-slate-600">
            Al confirmar este pedido, declaras una intención real y seria de
            compra. Las unidades quedarán reservadas temporalmente y dejarán de
            estar disponibles para otros clientes mientras validamos el pago.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-5">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                Referencia temporal del checkout
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {orderNumber}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-5">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                Total a pagar
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {formatMoney(finalTotal, currency)}
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">
            Al confirmar este pedido, declaras una intención real y seria de
            compra. Las unidades quedarán reservadas temporalmente y dejarán de
            estar disponibles para otros clientes mientras validamos el pago.
            El pago y el envío del soporte deben realizarse dentro de las{" "}
            <strong>24 horas siguientes</strong>. Si no se recibe o valida el
            pago en ese plazo, la reserva podrá dejarse sin efecto y las
            unidades podrán volver a quedar disponibles para la venta.
          </div>

          <div className="mt-6 space-y-4">
            <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <input
                type="checkbox"
                checked={purchaseCommitted}
                onChange={(e) => setPurchaseCommitted(e.target.checked)}
                className="mt-1"
              />
              <div className="text-sm text-slate-700">
                <p className="font-medium text-slate-900">Compromiso de compra</p>
                <p className="mt-1">
                  Confirmo que este pedido corresponde a una intención real y seria
                  de compra. Entiendo que al continuar las unidades quedarán
                  reservadas temporalmente mientras se valida el pago y que debo
                  realizar el pago y enviar el soporte dentro de las{" "}
                  <strong>24 horas siguientes</strong>.
                </p>
              </div>
            </label>

            <button
              onClick={handleConfirmOrder}
              disabled={!purchaseCommitted || confirmingOrder}
              className="w-full rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {confirmingOrder
                ? "Confirmando pedido..."
                : "Confirmar pedido y reservar inventario"}
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold">Datos para transferencia</h2>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 md:col-span-2">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                    Opción 1
                  </p>
                  <p className="mt-1 text-lg font-bold text-slate-900">
                    Banco ITAÚ
                  </p>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                        Titular
                      </p>
                      <p className="mt-1 font-semibold text-slate-900">
                        Comercializadora AETOS SAS
                      </p>
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                        Tipo de cuenta
                      </p>
                      <p className="mt-1 font-semibold text-slate-900">
                        Cuenta de Ahorros
                      </p>
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                        Número de cuenta
                      </p>
                      <p className="mt-1 font-semibold text-slate-900">
                        213 186 906
                      </p>
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                        NIT
                      </p>
                      <p className="mt-1 font-semibold text-slate-900">
                        900.197.911-5
                      </p>
                    </div>

                    <div className="md:col-span-2 rounded-2xl bg-emerald-50 p-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-emerald-700">
                        Llave Bre-B
                      </p>
                      <p className="mt-1 text-base font-semibold text-emerald-900">
                        0090218528
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 md:col-span-2">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                    Opción 2
                  </p>
                  <p className="mt-1 text-lg font-bold text-slate-900">
                    Banco Bancolombia
                  </p>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                        Titular
                      </p>
                      <p className="mt-1 font-semibold text-slate-900">
                        Comercializadora AETOS SAS
                      </p>
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                        Tipo de cuenta
                      </p>
                      <p className="mt-1 font-semibold text-slate-900">
                        Cuenta de Ahorros
                      </p>
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                        Número de cuenta
                      </p>
                      <p className="mt-1 font-semibold text-slate-900">
                        688-000082-53
                      </p>
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                        NIT
                      </p>
                      <p className="mt-1 font-semibold text-slate-900">
                        900.197.911-5
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">
                Realiza el pago por el valor exacto del pedido y usa como
                referencia interna <strong>{orderNumber}</strong>. El soporte debe
                enviarse dentro de las <strong>24 horas siguientes</strong>.
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold">Envío del soporte</h2>

              <div className="mt-4 space-y-3 text-sm text-slate-700">
                <p>
                  <span className="font-semibold text-slate-900">Correo:</span>{" "}
                  ventas@movitecgames.com
                </p>
                <p>
                  <span className="font-semibold text-slate-900">
                    Asunto del correo:
                  </span>{" "}
                  {orderNumber}
                </p>
                <p>
                  <span className="font-semibold text-slate-900">
                    Instrucción:
                  </span>{" "}
                  Adjunta el soporte de pago y usa en el asunto el número del
                  pedido para facilitar la validación.
                </p>
              </div>

              <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-xs leading-6 text-slate-500">
                Envía el soporte de pago a <strong>ventas@movitecgames.com</strong>{" "}
                dentro de las <strong>24 horas siguientes</strong> a la
                confirmación del pedido, usando como asunto el número de la orden.
                Una vez se verifique el pago, se continuará con el alistamiento y
                la coordinación de entrega.
              </div>
            </section>

            {!!items.length && (
              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-bold">Resumen del pedido</h2>

                <div className="mt-5 space-y-3">
                  {items.map((item) => {
                    const subtotal =
                      Number(item.unit_price || 0) * Number(item.quantity || 0)

                    return (
                      <div
                        key={item.id}
                        className="rounded-2xl bg-slate-50 p-4"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-semibold text-slate-900">
                              {item.title || "Producto"}
                            </p>
                            <p className="mt-1 text-sm text-slate-600">
                              Cantidad: {item.quantity || 0}
                            </p>
                            <p className="text-sm text-slate-600">
                              Precio unitario:{" "}
                              {formatMoney(Number(item.unit_price || 0), currency)}
                            </p>
                          </div>

                          <p className="text-sm font-bold text-slate-900">
                            {formatMoney(subtotal, currency)}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            )}
          </div>

          <aside className="space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold">Resumen financiero</h2>

              <div className="mt-5 space-y-3 text-sm">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Total PVP</span>
                  <span>{formatMoney(totalPvp, currency)}</span>
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <span>{commercialLabel}</span>
                  <span>- {formatMoney(commercialValue, currency)}</span>
                </div>

                <div className="flex items-center justify-between font-semibold text-slate-900">
                  <span>Total con condición comercial</span>
                  <span>{formatMoney(totalWithCommercialTerms, currency)}</span>
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <span>Envío</span>
                  <span>{formatMoney(shippingCost, currency)}</span>
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <span>Retefuente</span>
                  <span>- {formatMoney(retefuenteValue, currency)}</span>
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <span>ICA</span>
                  <span>- {formatMoney(icaValue, currency)}</span>
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <span>Costo adicional por pago</span>
                  <span>{formatMoney(paymentFee, currency)}</span>
                </div>

                <hr className="my-2 border-slate-200" />

                <div className="flex items-center justify-between text-lg font-bold text-slate-900">
                  <span>Total a pagar</span>
                  <span>{formatMoney(finalTotal, currency)}</span>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold">Datos del cliente</h2>

              <div className="mt-4 space-y-3 text-sm text-slate-700">
                <p>
                  <span className="font-semibold text-slate-900">Nombre:</span>{" "}
                  {customerName || "No registrado"}
                </p>
                <p>
                  <span className="font-semibold text-slate-900">Empresa:</span>{" "}
                  {cart.shipping_address?.company || "No registrada"}
                </p>
                <p>
                  <span className="font-semibold text-slate-900">Correo:</span>{" "}
                  {cart.email || customer?.email || "No registrado"}
                </p>
                <p>
                  <span className="font-semibold text-slate-900">Teléfono:</span>{" "}
                  {cart.shipping_address?.phone || "No registrado"}
                </p>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold">Entrega</h2>

              <div className="mt-4 space-y-3 text-sm text-slate-700">
                <p>
                  <span className="font-semibold text-slate-900">Modalidad:</span>{" "}
                  {deliveryMode === "pickup"
                    ? "Recoger en bodega"
                    : deliveryMode === "bogota"
                    ? "Entrega en Bogotá"
                    : "Envío nacional"}
                </p>

                {deliveryMode === "pickup" ? (
                  <p>
                    <span className="font-semibold text-slate-900">
                      Instrucciones:
                    </span>{" "}
                    {pickupInstructions || "Sin instrucciones adicionales"}
                  </p>
                ) : (
                  <>
                    <p>
                      <span className="font-semibold text-slate-900">
                        Dirección:
                      </span>{" "}
                      {cart.shipping_address?.address_1 || "No registrada"}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-900">Ciudad:</span>{" "}
                      {cart.shipping_address?.city || "No registrada"}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-900">
                        Departamento:
                      </span>{" "}
                      {cart.shipping_address?.province || "No registrado"}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-900">
                        Código postal:
                      </span>{" "}
                      {cart.shipping_address?.postal_code || "No registrado"}
                    </p>
                  </>
                )}

                {deliveryMode === "nacional" && selectedShippingLabel && (
                  <p>
                    <span className="font-semibold text-slate-900">Servicio:</span>{" "}
                    {selectedShippingLabel}
                  </p>
                )}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  )
}