"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { medusa } from "../../../../lib/medusa"

type OrderLineItem = {
  id: string
  title?: string
  quantity?: number
  unit_price?: number
  total?: number
  subtotal?: number
}

type OrderAddress = {
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

type OrderType = {
  id: string
  display_id?: number | string
  created_at?: string
  total?: number
  currency_code?: string
  payment_status?: string
  fulfillment_status?: string
  status?: string
  metadata?: Record<string, any> | null
  email?: string
  items?: OrderLineItem[]
  shipping_address?: OrderAddress | null
  billing_address?: OrderAddress | null
}

type SnapshotItem = {
  order_id: string
  public_order_number?: string | null
  customer_email?: string | null
  customer_name?: string | null
  company?: string | null
  phone?: string | null
  payment_method?: string | null
  commercial_payment_status?: string | null
  delivery_mode?: string | null
  shipping_address?: string | null
  currency_code?: string | null
  final_total?: number | null
  created_at?: string | null

  total_pvp?: number | null
  commercial_label?: string | null
  commercial_value?: number | null
  total_with_commercial_terms?: number | null
  shipping_cost?: number | null
  retefuente_value?: number | null
  ica_value?: number | null
  payment_fee?: number | null

  summary_json?: {
    total_pvp?: number
    commercial_label?: string
    commercial_value?: number
    total_with_commercial_terms?: number
    shipping_cost?: number
    retefuente_value?: number
    ica_value?: number
    payment_fee?: number
  } | null

  items_json?: Array<{
    title?: string
    quantity?: number
    unit_price?: number
    subtotal?: number
  }> | null

  delivery_status?: string | null
  carrier_name?: string | null
  tracking_number?: string | null
  shipped_at?: string | null
  delivered_at?: string | null
  delivered_to?: string | null
  delivery_notes?: string | null
  picked_up_by?: string | null
  picked_up_at?: string | null
}

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDate(value?: string) {
  if (!value) return "No disponible"

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return "No disponible"

  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}

function getPublicOrderNumber(order: OrderType | null, snapshot?: SnapshotItem | null) {
  if (snapshot?.public_order_number) {
    return String(snapshot.public_order_number).trim()
  }

  const metadata = order?.metadata || {}

  return (
    String(metadata.public_order_number || "").trim() ||
    String(metadata.order_number || "").trim() ||
    (order?.display_id ? `MV-${order.display_id}` : "Pedido sin número")
  )
}

function getPaymentMethodLabel(order: OrderType | null, snapshot?: SnapshotItem | null) {
  const snapshotMethod = String(snapshot?.payment_method || "")
    .trim()
    .toLowerCase()

  if (snapshotMethod === "wompi") return "Wompi"
  if (snapshotMethod === "breb") return "Bre-B / transferencia"

  const metadata = order?.metadata || {}
  const value = String(
    metadata.payment_method ||
      metadata.checkout_payment_method ||
      metadata.cart_payment_method ||
      ""
  )
    .trim()
    .toLowerCase()

  if (value === "wompi") return "Wompi"
  if (value === "breb") return "Bre-B / transferencia"

  return "No definido"
}

function getPaymentStatusLabel(order: OrderType | null, snapshot?: SnapshotItem | null) {
  const snapshotStatus = String(snapshot?.commercial_payment_status || "")
    .trim()
    .toLowerCase()

  if (snapshotStatus === "pending") return "Pendiente de pago"
  if (snapshotStatus === "under_review") return "Pago en validación"
  if (snapshotStatus === "paid") return "Pagado"
  if (snapshotStatus === "rejected") return "Pago rechazado"
  if (snapshotStatus === "expired") return "Expirado"

  const metadata = order?.metadata || {}
  const commercialStatus = String(
    metadata.commercial_payment_status ||
      metadata.b2b_payment_status ||
      metadata.manual_payment_status ||
      ""
  )
    .trim()
    .toLowerCase()

  if (
    commercialStatus === "pending" ||
    commercialStatus === "awaiting_payment" ||
    commercialStatus === "waiting_payment"
  ) {
    return "Pendiente de pago"
  }

  if (
    commercialStatus === "under_review" ||
    commercialStatus === "validating" ||
    commercialStatus === "payment_submitted"
  ) {
    return "Pago en validación"
  }

  if (
    commercialStatus === "paid" ||
    commercialStatus === "approved" ||
    commercialStatus === "validated"
  ) {
    return "Pagado"
  }

  if (
    commercialStatus === "rejected" ||
    commercialStatus === "failed" ||
    commercialStatus === "expired"
  ) {
    return "Pago rechazado"
  }

  const normalized = String(order?.payment_status || "")
    .trim()
    .toLowerCase()

  if (
    normalized === "paid" ||
    normalized === "captured" ||
    normalized === "authorized"
  ) {
    return "Pagado"
  }

  if (normalized === "awaiting" || normalized === "pending") {
    return "Pendiente de pago"
  }

  if (normalized === "canceled" || normalized === "cancelled") {
    return "Pago cancelado"
  }

  if (normalized === "requires_action") {
    return "Requiere acción"
  }

  if (normalized === "not_paid") {
    return "No pagado"
  }

  return "Pendiente de pago"
}

function getDeliveryStatusLabel(order: OrderType | null, snapshot?: SnapshotItem | null) {
  const snapshotStatus = String(snapshot?.delivery_status || "")
    .trim()
    .toLowerCase()

  if (snapshotStatus === "pending_preparation") return "Pendiente de alistamiento"
  if (snapshotStatus === "ready_for_pickup") return "Listo para recoger"
  if (snapshotStatus === "picked_up") return "Recogido en bodega"
  if (snapshotStatus === "shipped") return "Despachado"
  if (snapshotStatus === "delivered") return "Entregado"
  if (snapshotStatus === "cancelled") return "Cancelado"

  const normalized = String(order?.fulfillment_status || "").trim().toLowerCase()

  if (normalized === "fulfilled") return "Despachado"
  if (normalized === "partially_fulfilled") return "Despacho parcial"
  if (normalized === "not_fulfilled") return "Pendiente de despacho"
  if (normalized === "shipped") return "Enviado"
  if (normalized === "delivered") return "Entregado"
  if (normalized === "canceled" || normalized === "cancelled") return "Cancelado"

  return "Pendiente de despacho"
}

function getOrderCurrency(order: OrderType | null, snapshot?: SnapshotItem | null) {
  if (snapshot?.currency_code) {
    return String(snapshot.currency_code).toUpperCase()
  }

  const metadata = order?.metadata || {}

  return String(
    metadata.currency_code ||
      metadata.checkout_currency_code ||
      order?.currency_code ||
      "COP"
  ).toUpperCase()
}

function getOrderFinalTotal(order: OrderType | null, snapshot?: SnapshotItem | null) {
  const snapshotTotal = Number(snapshot?.final_total)
  if (Number.isFinite(snapshotTotal)) {
    return snapshotTotal
  }

  const metadata = order?.metadata || {}
  const candidates = [
    metadata.final_total,
    metadata.checkout_final_total,
    metadata.cart_final_payable_total,
    metadata.total_to_pay,
    metadata.total_payable,
    order?.total,
  ]

  for (const candidate of candidates) {
    const parsed = Number(candidate)
    if (Number.isFinite(parsed)) {
      return parsed
    }
  }

  return 0
}

function getSnapshotNumberValue(...values: unknown[]) {
  for (const value of values) {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) {
      return parsed
    }
  }
  return 0
}

export default function CustomerOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const [order, setOrder] = useState<OrderType | null>(null)
  const [snapshot, setSnapshot] = useState<SnapshotItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    const loadOrder = async () => {
      try {
        setLoading(true)
        setErrorMessage("")

        const resolvedParams = await params

        const response = await medusa.store.order.retrieve(resolvedParams.id, {
          fields:
            "*items,*shipping_address,*billing_address,*metadata",
        } as any)

        const loadedOrder = (response as any)?.order || null
        setOrder(loadedOrder as OrderType)

        const snapshotResponse = await fetch(
          `/api/b2b/order-snapshots?order_id=${encodeURIComponent(resolvedParams.id)}`,
          {
            method: "GET",
            cache: "no-store",
          }
        )

        const snapshotData = await snapshotResponse.json().catch(() => null)

        if (snapshotResponse.ok && snapshotData?.ok) {
          setSnapshot((snapshotData.snapshot as SnapshotItem) || null)
        } else {
          setSnapshot(null)
        }
      } catch (error) {
        console.error("[CUSTOMER_ORDER_DETAIL_PAGE] unexpected error", error)
        setOrder(null)
        setSnapshot(null)
        setErrorMessage(
          "No fue posible cargar el detalle del pedido."
        )
      } finally {
        setLoading(false)
      }
    }

    loadOrder()
  }, [params])

  const currency = getOrderCurrency(order, snapshot)
  const publicOrderNumber = getPublicOrderNumber(order, snapshot)
  const finalTotal = getOrderFinalTotal(order, snapshot)

  const summary = useMemo(() => {
    const metadata = order?.metadata || {}
    const snapshotSummary = snapshot?.summary_json || null

    const hasFlatSnapshotValues =
      snapshot &&
      (
        snapshot.total_pvp != null ||
        snapshot.commercial_label != null ||
        snapshot.commercial_value != null ||
        snapshot.total_with_commercial_terms != null ||
        snapshot.shipping_cost != null ||
        snapshot.retefuente_value != null ||
        snapshot.ica_value != null ||
        snapshot.payment_fee != null
      )

    if (hasFlatSnapshotValues) {
      return {
        total_pvp: getSnapshotNumberValue(snapshot?.total_pvp, 0),
        commercial_label: String(
          snapshot?.commercial_label || "Condición comercial"
        ),
        commercial_value: getSnapshotNumberValue(snapshot?.commercial_value, 0),
        total_with_commercial_terms: getSnapshotNumberValue(
          snapshot?.total_with_commercial_terms,
          0
        ),
        shipping_cost: getSnapshotNumberValue(snapshot?.shipping_cost, 0),
        retefuente_value: getSnapshotNumberValue(snapshot?.retefuente_value, 0),
        ica_value: getSnapshotNumberValue(snapshot?.ica_value, 0),
        payment_fee: getSnapshotNumberValue(snapshot?.payment_fee, 0),
      }
    }

    if (snapshotSummary) {
      return {
        total_pvp: Number(snapshotSummary.total_pvp || 0),
        commercial_label: String(
          snapshotSummary.commercial_label || "Condición comercial"
        ),
        commercial_value: Number(snapshotSummary.commercial_value || 0),
        total_with_commercial_terms: Number(
          snapshotSummary.total_with_commercial_terms || 0
        ),
        shipping_cost: Number(snapshotSummary.shipping_cost || 0),
        retefuente_value: Number(snapshotSummary.retefuente_value || 0),
        ica_value: Number(snapshotSummary.ica_value || 0),
        payment_fee: Number(snapshotSummary.payment_fee || 0),
      }
    }

    return {
      total_pvp: Number(
        metadata.total_pvp ??
          metadata.checkout_total_pvp ??
          metadata.cart_total_pvp ??
          0
      ),
      commercial_label: String(
        metadata.commercial_label ??
          metadata.checkout_commercial_label ??
          metadata.cart_commercial_label ??
          "Condición comercial"
      ),
      commercial_value: Number(
        metadata.commercial_value ??
          metadata.checkout_commercial_value ??
          metadata.cart_commercial_value ??
          0
      ),
      total_with_commercial_terms: Number(
        metadata.total_with_commercial_terms ??
          metadata.checkout_total_with_commercial_terms ??
          metadata.cart_total_with_commercial_terms ??
          0
      ),
      shipping_cost: Number(
        metadata.shipping_cost ??
          metadata.checkout_shipping_cost ??
          metadata.selected_shipping_price ??
          0
      ),
      retefuente_value: Number(
        metadata.retefuente_value ??
          metadata.checkout_retefuente_value ??
          0
      ),
      ica_value: Number(
        metadata.ica_value ??
          metadata.checkout_ica_value ??
          0
      ),
      payment_fee: Number(
        metadata.payment_fee ??
          metadata.checkout_payment_fee ??
          metadata.payment_fee_value ??
          0
      ),
    }
  }, [order, snapshot])

  const customerName = useMemo(() => {
    if (snapshot?.customer_name) {
      return String(snapshot.customer_name)
    }

    return [
      order?.shipping_address?.first_name || "",
      order?.shipping_address?.last_name || "",
    ]
      .filter(Boolean)
      .join(" ")
  }, [order, snapshot])

  if (loading) {
    return (
      <main className="min-h-screen bg-neutral-50 text-slate-900">
        <div className="mx-auto max-w-5xl px-6 py-10">
          <p className="text-sm text-slate-500">Cargando pedido…</p>
        </div>
      </main>
    )
  }

  if (!order) {
    return (
      <main className="min-h-screen bg-neutral-50 text-slate-900">
        <div className="mx-auto max-w-5xl px-6 py-10">
          <h1 className="text-3xl font-bold">Detalle del pedido</h1>
          <p className="mt-3 text-slate-600">
            {errorMessage || "No fue posible encontrar el pedido solicitado."}
          </p>

          <Link
            href="/cuenta/pedidos"
            className="mt-6 inline-flex rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white"
          >
            Volver a mis pedidos
          </Link>
        </div>
      </main>
    )
  }

  const detailItems =
    Array.isArray(snapshot?.items_json) && snapshot?.items_json.length
      ? snapshot.items_json.map((item, index) => ({
          id: `snapshot-item-${index}`,
          title: String(item?.title || "Producto"),
          quantity: Number(item?.quantity || 0),
          unit_price: Number(item?.unit_price || 0),
          subtotal:
            Number(item?.subtotal || 0) ||
            Number(item?.unit_price || 0) * Number(item?.quantity || 0),
        }))
      : (order.items || []).map((item) => ({
          id: item.id,
          title: item.title || "Producto",
          quantity: Number(item.quantity || 0),
          unit_price: Number(item.unit_price || 0),
          subtotal:
            Number(item.subtotal || item.total || 0) ||
            Number(item.unit_price || 0) * Number(item.quantity || 0),
        }))

  return (
    <main className="min-h-screen bg-neutral-50 text-slate-900">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-6 flex items-center justify-between gap-4">
          <Link
            href="/cuenta/pedidos"
            className="text-sm font-medium text-slate-500 hover:text-slate-900"
          >
            ← Volver a mis pedidos
          </Link>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
            Pedido
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            {publicOrderNumber}
          </h1>

          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                Fecha
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {formatDate(order.created_at)}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                Total
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {formatMoney(finalTotal, currency)}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                Pago
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {getPaymentStatusLabel(order, snapshot)}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                Entrega
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {getDeliveryStatusLabel(order, snapshot)}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold">Productos</h2>

              <div className="mt-5 space-y-3">
                {detailItems.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl bg-slate-50 p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {item.title}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          Cantidad: {item.quantity}
                        </p>
                        <p className="text-sm text-slate-600">
                          Precio unitario: {formatMoney(item.unit_price, currency)}
                        </p>
                      </div>

                      <p className="text-sm font-bold text-slate-900">
                        {formatMoney(item.subtotal, currency)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold">Entrega</h2>

              <div className="mt-4 space-y-3 text-sm text-slate-700">
                <p>
                  <span className="font-semibold text-slate-900">Método de pago:</span>{" "}
                  {getPaymentMethodLabel(order, snapshot)}
                </p>
                <p>
                  <span className="font-semibold text-slate-900">Estado logístico:</span>{" "}
                  {getDeliveryStatusLabel(order, snapshot)}
                </p>
                <p>
                  <span className="font-semibold text-slate-900">Dirección:</span>{" "}
                  {order.shipping_address?.address_1 || snapshot?.shipping_address || "No registrada"}
                </p>
                <p>
                  <span className="font-semibold text-slate-900">Ciudad:</span>{" "}
                  {order.shipping_address?.city || "No registrada"}
                </p>
                <p>
                  <span className="font-semibold text-slate-900">Departamento:</span>{" "}
                  {order.shipping_address?.province || "No registrado"}
                </p>
                <p>
                  <span className="font-semibold text-slate-900">Código postal:</span>{" "}
                  {order.shipping_address?.postal_code || "No registrado"}
                </p>

                {snapshot?.carrier_name ? (
                  <p>
                    <span className="font-semibold text-slate-900">Transportadora:</span>{" "}
                    {snapshot.carrier_name}
                  </p>
                ) : null}

                {snapshot?.tracking_number ? (
                  <p>
                    <span className="font-semibold text-slate-900">Número de guía:</span>{" "}
                    {snapshot.tracking_number}
                  </p>
                ) : null}

                {snapshot?.shipped_at ? (
                  <p>
                    <span className="font-semibold text-slate-900">Fecha de despacho:</span>{" "}
                    {formatDate(snapshot.shipped_at)}
                  </p>
                ) : null}

                {snapshot?.delivered_to ? (
                  <p>
                    <span className="font-semibold text-slate-900">Recibido por:</span>{" "}
                    {snapshot.delivered_to}
                  </p>
                ) : null}

                {snapshot?.delivered_at ? (
                  <p>
                    <span className="font-semibold text-slate-900">Fecha de entrega:</span>{" "}
                    {formatDate(snapshot.delivered_at)}
                  </p>
                ) : null}

                {snapshot?.picked_up_by ? (
                  <p>
                    <span className="font-semibold text-slate-900">Recogido por:</span>{" "}
                    {snapshot.picked_up_by}
                  </p>
                ) : null}

                {snapshot?.picked_up_at ? (
                  <p>
                    <span className="font-semibold text-slate-900">Fecha de recogida:</span>{" "}
                    {formatDate(snapshot.picked_up_at)}
                  </p>
                ) : null}

                {snapshot?.delivery_notes ? (
                  <p>
                    <span className="font-semibold text-slate-900">Observaciones:</span>{" "}
                    {snapshot.delivery_notes}
                  </p>
                ) : null}
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold">Resumen financiero</h2>

              <div className="mt-5 space-y-3 text-sm">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Total PVP</span>
                  <span>{formatMoney(summary.total_pvp, currency)}</span>
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <span>{summary.commercial_label}</span>
                  <span>- {formatMoney(summary.commercial_value, currency)}</span>
                </div>

                <div className="flex items-center justify-between font-semibold text-slate-900">
                  <span>Total con condición comercial</span>
                  <span>
                    {formatMoney(summary.total_with_commercial_terms, currency)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <span>Envío</span>
                  <span>{formatMoney(summary.shipping_cost, currency)}</span>
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <span>Retefuente</span>
                  <span>- {formatMoney(summary.retefuente_value, currency)}</span>
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <span>ICA</span>
                  <span>- {formatMoney(summary.ica_value, currency)}</span>
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <span>Costo adicional por pago</span>
                  <span>{formatMoney(summary.payment_fee, currency)}</span>
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
                  {snapshot?.company || order.shipping_address?.company || "No registrada"}
                </p>
                <p>
                  <span className="font-semibold text-slate-900">Correo:</span>{" "}
                  {snapshot?.customer_email || order.email || "No registrado"}
                </p>
                <p>
                  <span className="font-semibold text-slate-900">Teléfono:</span>{" "}
                  {snapshot?.phone || order.shipping_address?.phone || "No registrado"}
                </p>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  )
}