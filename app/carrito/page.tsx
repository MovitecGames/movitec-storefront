"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { medusa } from "../../lib/medusa"
import {
  deleteLineItem,
  retrieveCart,
  transferCart,
  updateLineItem,
} from "../../lib/medusa-cart"
import { getStoredCartId } from "../../lib/cart-storage"

type CartLineItem = {
  id: string
  title?: string
  quantity?: number
  unit_price?: number
}

type CartType = {
  id: string
  currency_code?: string
  items?: CartLineItem[]
}

type CustomerItem = {
  email?: string
  metadata?: {
    approved?: boolean
    [key: string]: any
  } | null
}

export default function CarritoPage() {
  const [cart, setCart] = useState<CartType | null>(null)
  const [customer, setCustomer] = useState<CustomerItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [paymentMethod, setPaymentMethod] = useState<"breb" | "wompi">("breb")
  const [retentionType, setRetentionType] = useState<
    "none" | "retefuente" | "retefuente_ica"
  >("none")

  const loadCart = async () => {
    try {
      const cartId = getStoredCartId()

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
    loadCart()
  }, [])

  const items = cart?.items || []
  const currency = cart?.currency_code?.toUpperCase() || "COP"

  const getLineSubtotal = (item: CartLineItem) => {
    return (item.unit_price || 0) * (item.quantity || 0)
  }

  const totalPvp = useMemo(() => {
    return items.reduce((acc, item) => acc + getLineSubtotal(item), 0)
  }, [items])

  const commercialTerms = useMemo(() => {
    if (totalPvp >= 4000000) {
      return {
        rate: 0.38,
        label: "Condición comercial 38%",
        tier: "Nivel estratégico",
        nextThreshold: null,
      }
    }

    if (totalPvp >= 2000000) {
      return {
        rate: 0.35,
        label: "Condición comercial 35%",
        tier: "Nivel profesional",
        nextThreshold: 4000000,
      }
    }

    if (totalPvp >= 800000) {
      return {
        rate: 0.32,
        label: "Condición comercial 32%",
        tier: "Nivel inicial",
        nextThreshold: 2000000,
      }
    }

    return {
      rate: 0,
      label: "Sin condición comercial por volumen",
      tier: "Sin nivel activo",
      nextThreshold: 800000,
    }
  }, [totalPvp])

  const commercialValue = totalPvp * commercialTerms.rate
  const totalWithCommercialTerms = totalPvp - commercialValue

  const ivaIncluded = totalWithCommercialTerms * (19 / 119)
  const baseWithoutIVA = totalWithCommercialTerms - ivaIncluded

  let retefuente = 0
  let ica = 0

  if (retentionType === "retefuente") {
    retefuente = baseWithoutIVA * 0.025
  }

  if (retentionType === "retefuente_ica") {
    retefuente = baseWithoutIVA * 0.025
    ica = baseWithoutIVA * 0.00966
  }

  const paymentFeeRate = paymentMethod === "wompi" ? 0.03 : 0
  const paymentFeeValue = totalWithCommercialTerms * paymentFeeRate

  const finalPayableTotal =
    totalWithCommercialTerms - retefuente - ica + paymentFeeValue

  const missingToNextTier =
    commercialTerms.nextThreshold && totalPvp < commercialTerms.nextThreshold
      ? commercialTerms.nextThreshold - totalPvp
      : 0

  const handleIncrease = async (itemId: string, quantity: number) => {
    const cartId = getStoredCartId()
    if (!cartId) return

    await updateLineItem(cartId, itemId, quantity + 1)
    await loadCart()
  }

  const handleDecrease = async (itemId: string, quantity: number) => {
    const cartId = getStoredCartId()
    if (!cartId) return

    if (quantity <= 1) {
      await deleteLineItem(cartId, itemId)
    } else {
      await updateLineItem(cartId, itemId, quantity - 1)
    }

    await loadCart()
  }

  const handleRemove = async (itemId: string) => {
    const cartId = getStoredCartId()
    if (!cartId) return

    await deleteLineItem(cartId, itemId)
    await loadCart()
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-neutral-50 text-slate-900">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <p className="text-sm text-slate-500">Cargando carrito…</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-neutral-50 text-slate-900">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-6 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="text-sm font-medium text-slate-500 hover:text-slate-900"
          >
            ← Volver al catálogo
          </Link>
        </div>

        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
            Pedido B2B
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            Carrito comercial
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            Este resumen aplica condiciones comerciales por volumen sobre el PVP.
            El cliente puede escoger entre pago por transferencia o Bre-B sin
            costo adicional, o pago por pasarela digital con incremento del 3%.
          </p>
        </div>

        {!items.length ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
            <h2 className="text-xl font-bold">Tu carrito está vacío</h2>
            <p className="mt-2 text-slate-600">
              Agrega productos desde el catálogo para construir tu pedido B2B.
            </p>

            <div className="mt-6">
              <Link
                href="/"
                className="inline-flex rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Volver al catálogo
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1.45fr_0.85fr]">
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h2 className="text-lg font-bold">{item.title}</h2>

                      <p className="mt-2 text-sm text-slate-600">
                        Precio PVP unitario:{" "}
                        <span className="font-semibold text-slate-900">
                          {new Intl.NumberFormat("es-CO", {
                            style: "currency",
                            currency,
                            maximumFractionDigits: 0,
                          }).format(item.unit_price || 0)}
                        </span>
                      </p>

                      <div className="mt-4 flex items-center gap-3">
                        <button
                          onClick={() =>
                            handleDecrease(item.id, item.quantity || 1)
                          }
                          className="h-10 w-10 rounded-xl border border-slate-300 text-lg font-bold text-slate-700 hover:bg-slate-50"
                        >
                          -
                        </button>

                        <div className="flex h-10 min-w-[56px] items-center justify-center rounded-xl border border-slate-300 px-4 font-semibold">
                          {item.quantity || 0}
                        </div>

                        <button
                          onClick={() =>
                            handleIncrease(item.id, item.quantity || 0)
                          }
                          className="h-10 w-10 rounded-xl border border-slate-300 text-lg font-bold text-slate-700 hover:bg-slate-50"
                        >
                          +
                        </button>
                      </div>

                      <p className="mt-4 text-sm font-semibold text-slate-900">
                        Subtotal PVP:{" "}
                        {new Intl.NumberFormat("es-CO", {
                          style: "currency",
                          currency,
                          maximumFractionDigits: 0,
                        }).format(getLineSubtotal(item))}
                      </p>
                    </div>

                    <button
                      onClick={() => handleRemove(item.id)}
                      className="rounded-xl border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Política comercial
                </p>
                <h3 className="mt-2 text-xl font-bold tracking-tight">
                  Condiciones comerciales por volumen
                </h3>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-900">
                      32% sobre PVP
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Compras entre $800.000 y $1.990.000
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-900">
                      35% sobre PVP
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Compras entre $2.000.000 y $3.990.000
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-900">
                      38% sobre PVP
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Compras superiores a $4.000.000
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Condición activa
                </p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight">
                  {commercialTerms.tier}
                </h2>

                <p className="mt-2 text-sm text-slate-600">
                  {commercialTerms.label}
                </p>

                {missingToNextTier > 0 ? (
                  <div className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">
                    Te faltan{" "}
                    <span className="font-semibold">
                      {new Intl.NumberFormat("es-CO", {
                        style: "currency",
                        currency,
                        maximumFractionDigits: 0,
                      }).format(missingToNextTier)}
                    </span>{" "}
                    para acceder al siguiente nivel comercial.
                  </div>
                ) : (
                  <div className="mt-4 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-900">
                    Ya estás en el nivel comercial más alto disponible por volumen.
                  </div>
                )}
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Retenciones
                </p>
                <h2 className="mt-2 text-xl font-bold tracking-tight">
                  Configuración manual
                </h2>

                <div className="mt-4 space-y-3">
                  <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 p-4 hover:bg-slate-50">
                    <input
                      type="radio"
                      name="retentionType"
                      value="none"
                      checked={retentionType === "none"}
                      onChange={() => setRetentionType("none")}
                      className="mt-1"
                    />
                    <div>
                      <p className="font-semibold text-slate-900">No aplica</p>
                      <p className="text-sm text-slate-500">
                        Sin retenciones sobre la base.
                      </p>
                    </div>
                  </label>

                  <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 p-4 hover:bg-slate-50">
                    <input
                      type="radio"
                      name="retentionType"
                      value="retefuente"
                      checked={retentionType === "retefuente"}
                      onChange={() => setRetentionType("retefuente")}
                      className="mt-1"
                    />
                    <div>
                      <p className="font-semibold text-slate-900">
                        Retefuente 2.5%
                      </p>
                      <p className="text-sm text-slate-500">
                        Aplicada sobre la base sin IVA.
                      </p>
                    </div>
                  </label>

                  <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 p-4 hover:bg-slate-50">
                    <input
                      type="radio"
                      name="retentionType"
                      value="retefuente_ica"
                      checked={retentionType === "retefuente_ica"}
                      onChange={() => setRetentionType("retefuente_ica")}
                      className="mt-1"
                    />
                    <div>
                      <p className="font-semibold text-slate-900">
                        Retefuente + ICA
                      </p>
                      <p className="text-sm text-slate-500">
                        Retefuente 2.5% + ICA 0.966% sobre la base sin IVA.
                      </p>
                    </div>
                  </label>
                </div>

                <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-xs leading-6 text-slate-500">
                  La selección realizada por el cliente debe corresponder a su
                  situación tributaria real. La aplicación efectiva de
                  retenciones y la emisión de certificaciones correspondientes
                  serán responsabilidad del comprador conforme a la normatividad
                  aplicable.
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Método de pago
                </p>

                <div className="mt-4 space-y-3">
                  <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 p-4 hover:bg-slate-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="breb"
                      checked={paymentMethod === "breb"}
                      onChange={() => setPaymentMethod("breb")}
                      className="mt-1"
                    />
                    <div>
                      <p className="font-semibold text-slate-900">
                        Bre-B / transferencia directa
                      </p>
                      <p className="text-sm text-slate-500">
                        Sin costo adicional. El cliente deberá enviar el soporte
                        de pago al correo comercial dentro del plazo indicado.
                      </p>
                    </div>
                  </label>

                  <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 p-4 hover:bg-slate-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="wompi"
                      checked={paymentMethod === "wompi"}
                      onChange={() => setPaymentMethod("wompi")}
                      className="mt-1"
                    />
                    <div>
                      <p className="font-semibold text-slate-900">
                        Wompi / pasarela digital
                      </p>
                      <p className="text-sm text-slate-500">
                        Incremento del 3% sobre el valor final de la orden.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-bold">Resumen financiero</h2>

                <div className="mt-5 space-y-3 text-sm">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Total PVP</span>
                    <span>
                      {new Intl.NumberFormat("es-CO", {
                        style: "currency",
                        currency,
                        maximumFractionDigits: 0,
                      }).format(totalPvp)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span>{commercialTerms.label}</span>
                    <span>
                      -{" "}
                      {new Intl.NumberFormat("es-CO", {
                        style: "currency",
                        currency,
                        maximumFractionDigits: 0,
                      }).format(commercialValue)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between font-semibold text-slate-900">
                    <span>Total con condición comercial</span>
                    <span>
                      {new Intl.NumberFormat("es-CO", {
                        style: "currency",
                        currency,
                        maximumFractionDigits: 0,
                      }).format(totalWithCommercialTerms)}
                    </span>
                  </div>

                  <hr className="my-2 border-slate-200" />

                  <div className="flex items-center justify-between text-slate-600">
                    <span>Base sin IVA</span>
                    <span>
                      {new Intl.NumberFormat("es-CO", {
                        style: "currency",
                        currency,
                        maximumFractionDigits: 0,
                      }).format(baseWithoutIVA)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span>IVA incluido</span>
                    <span>
                      {new Intl.NumberFormat("es-CO", {
                        style: "currency",
                        currency,
                        maximumFractionDigits: 0,
                      }).format(ivaIncluded)}
                    </span>
                  </div>

                  <hr className="my-2 border-slate-200" />

                  <div className="flex items-center justify-between text-slate-600">
                    <span>Retefuente</span>
                    <span>
                      -{" "}
                      {new Intl.NumberFormat("es-CO", {
                        style: "currency",
                        currency,
                        maximumFractionDigits: 0,
                      }).format(retefuente)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span>ICA</span>
                    <span>
                      -{" "}
                      {new Intl.NumberFormat("es-CO", {
                        style: "currency",
                        currency,
                        maximumFractionDigits: 0,
                      }).format(ica)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span>
                      {paymentMethod === "wompi"
                        ? "Costo adicional pasarela"
                        : "Costo adicional por pago"}
                    </span>
                    <span>
                      {new Intl.NumberFormat("es-CO", {
                        style: "currency",
                        currency,
                        maximumFractionDigits: 0,
                      }).format(paymentFeeValue)}
                    </span>
                  </div>

                  <hr className="my-2 border-slate-200" />

                  <div className="flex items-center justify-between text-lg font-bold text-slate-900">
                    <span>Total a pagar</span>
                    <span>
                      {new Intl.NumberFormat("es-CO", {
                        style: "currency",
                        currency,
                        maximumFractionDigits: 0,
                      }).format(finalPayableTotal)}
                    </span>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-xs leading-6 text-slate-500">
                  Para pagos por transferencia o Bre-B, el cliente deberá enviar
                  el soporte de pago al correo comercial dentro de un plazo
                  máximo de 24 horas. Una vez se refleje el pago, se continuará
                  con el despacho del pedido.
                </div>

                <Link
                  href="/checkout"
                  className="mt-6 block w-full rounded-xl bg-slate-900 px-5 py-3 text-center text-sm font-semibold text-white hover:bg-slate-800"
                >
                  Continuar al checkout
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}