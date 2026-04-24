"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { medusa } from "../../../lib/medusa"

type OrderItem = {
  id: string
  display_id?: number | string
  created_at?: string
  total?: number
  currency_code?: string
  payment_status?: string
  fulfillment_status?: string
  status?: string
  metadata?: Record<string, any> | null
}

type CustomerItem = {
  id?: string
  email?: string
  first_name?: string
  last_name?: string
  metadata?: {
    approved?: boolean
    [key: string]: any
  } | null
}

type SnapshotItem = {
  order_id: string
  public_order_number?: string | null
  commercial_payment_status?: string | null
  delivery_status?: string | null
  carrier_name?: string | null
  tracking_number?: string | null
  delivered_to?: string | null
  delivered_at?: string | null
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

function getPublicOrderNumber(order: OrderItem) {
  const metadata = order.metadata || {}

  return (
    String(metadata.public_order_number || "").trim() ||
    String(metadata.order_number || "").trim() ||
    (order.display_id ? `MV-${order.display_id}` : "Pedido sin número")
  )
}

function getPaymentMethodLabel(order: OrderItem) {
  const metadata = order.metadata || {}
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

function getCommercialPaymentStatusLabel(order: OrderItem, snapshot?: SnapshotItem | null) {
  const snapshotStatus = String(snapshot?.commercial_payment_status || "")
    .trim()
    .toLowerCase()

  if (snapshotStatus === "pending") return "Pendiente de pago"
  if (snapshotStatus === "under_review") return "Pago en validación"
  if (snapshotStatus === "paid") return "Pagado"
  if (snapshotStatus === "rejected") return "Pago rechazado"
  if (snapshotStatus === "expired") return "Expirado"

  const metadata = order.metadata || {}

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

  const method = String(
    metadata.payment_method ||
      metadata.checkout_payment_method ||
      metadata.cart_payment_method ||
      ""
  )
    .trim()
    .toLowerCase()

  if (method === "breb") {
    return "Pendiente de pago"
  }

  const normalized = String(order.payment_status || "")
    .trim()
    .toLowerCase()

  if (method === "wompi") {
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
  }

  return "Pendiente de pago"
}

function getDeliveryStatusLabel(order: OrderItem, snapshot?: SnapshotItem | null) {
  const snapshotStatus = String(snapshot?.delivery_status || "")
    .trim()
    .toLowerCase()

  if (snapshotStatus === "pending_preparation") return "Pendiente de alistamiento"
  if (snapshotStatus === "ready_for_pickup") return "Listo para recoger"
  if (snapshotStatus === "picked_up") return "Recogido en bodega"
  if (snapshotStatus === "shipped") return "Despachado"
  if (snapshotStatus === "delivered") return "Entregado"
  if (snapshotStatus === "cancelled") return "Cancelado"

  const normalized = String(order.fulfillment_status || "").trim().toLowerCase()

  if (normalized === "fulfilled") return "Despachado"
  if (normalized === "partially_fulfilled") return "Despacho parcial"
  if (normalized === "not_fulfilled") return "Pendiente de despacho"
  if (normalized === "shipped") return "Enviado"
  if (normalized === "delivered") return "Entregado"
  if (normalized === "canceled" || normalized === "cancelled") return "Cancelado"

  return "Pendiente de despacho"
}

function getOrderCurrency(order: OrderItem) {
  const metadata = order.metadata || {}

  return String(
    metadata.currency_code ||
      metadata.checkout_currency_code ||
      order.currency_code ||
      "COP"
  ).toUpperCase()
}

function getOrderFinalTotal(order: OrderItem) {
  const metadata = order.metadata || {}

  const candidates = [
    metadata.final_total,
    metadata.checkout_final_total,
    metadata.cart_final_payable_total,
    metadata.total_to_pay,
    metadata.total_payable,
    order.total,
  ]

  for (const candidate of candidates) {
    const parsed = Number(candidate)
    if (Number.isFinite(parsed)) {
      return parsed
    }
  }

  return 0
}

export default function CustomerOrdersPage() {
  const [customer, setCustomer] = useState<CustomerItem | null>(null)
  const [orders, setOrders] = useState<OrderItem[]>([])
  const [snapshotsByOrderId, setSnapshotsByOrderId] = useState<Record<string, SnapshotItem>>({})
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    const loadOrders = async () => {
      try {
        setLoading(true)
        setErrorMessage("")

        const { customer } = await medusa.store.customer.retrieve()
        const loadedCustomer = customer as CustomerItem
        setCustomer(loadedCustomer)

        const response = await medusa.store.order.list({
          fields: "*metadata",
          order: "-created_at",
        } as any)

        const loadedOrders = Array.isArray((response as any)?.orders)
          ? ((response as any).orders as OrderItem[])
          : []

        setOrders(loadedOrders)

        const customerEmail = String(loadedCustomer?.email || "").trim().toLowerCase()

        if (customerEmail) {
          const snapshotsResponse = await fetch(
            `/api/b2b/order-snapshots?customer_email=${encodeURIComponent(customerEmail)}`,
            {
              method: "GET",
              cache: "no-store",
            }
          )

          const snapshotsData = await snapshotsResponse.json().catch(() => null)

          if (snapshotsResponse.ok && snapshotsData?.ok && Array.isArray(snapshotsData?.snapshots)) {
            const nextMap: Record<string, SnapshotItem> = {}

            for (const snapshot of snapshotsData.snapshots as SnapshotItem[]) {
              if (snapshot?.order_id) {
                nextMap[snapshot.order_id] = snapshot
              }
            }

            setSnapshotsByOrderId(nextMap)
          } else {
            setSnapshotsByOrderId({})
          }
        } else {
          setSnapshotsByOrderId({})
        }
      } catch (error) {
        console.error("[CUSTOMER_ORDERS_PAGE] unexpected error", error)
        setOrders([])
        setSnapshotsByOrderId({})
        setErrorMessage(
          "No fue posible cargar tus pedidos. Verifica que tu sesión esté activa."
        )
      } finally {
        setLoading(false)
      }
    }

    loadOrders()
  }, [])

  const customerName = useMemo(() => {
    return [customer?.first_name || "", customer?.last_name || ""]
      .filter(Boolean)
      .join(" ")
  }, [customer])

  if (loading) {
    return (
      <main className="min-h-screen bg-neutral-50 text-slate-900">
        <div className="mx-auto max-w-5xl px-6 py-10">
          <p className="text-sm text-slate-500">Cargando pedidos…</p>
        </div>
      </main>
    )
  }

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

        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
            Cuenta comercial
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            Mis pedidos
          </h1>

          <p className="mt-3 text-sm text-slate-600">
            {customerName
              ? `Cliente: ${customerName}`
              : customer?.email
              ? `Cliente: ${customer.email}`
              : "Historial de pedidos realizados desde tu cuenta."}
          </p>
        </div>

        {errorMessage ? (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            {errorMessage}
          </div>
        ) : null}

        {!orders.length ? (
          <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
            <h2 className="text-xl font-bold">Aún no tienes pedidos registrados</h2>
            <p className="mt-2 text-slate-600">
              Cuando confirmes tu primera compra, aquí podrás consultar el historial.
            </p>

            <div className="mt-6">
              <Link
                href="/"
                className="inline-flex rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Ir al catálogo
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {orders.map((order) => {
              const currency = getOrderCurrency(order)
              const publicOrderNumber = getPublicOrderNumber(order)
              const finalTotal = getOrderFinalTotal(order)
              const snapshot = snapshotsByOrderId[order.id]

              return (
                <div
                  key={order.id}
                  className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Pedido
                      </p>

                      <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                        {publicOrderNumber}
                      </h2>

                      <p className="text-sm text-slate-600">
                        Fecha: {formatDate(order.created_at)}
                      </p>

                      <p className="text-sm text-slate-600">
                        Método de pago: {getPaymentMethodLabel(order)}
                      </p>

                      {snapshot?.tracking_number ? (
                        <p className="text-sm text-slate-600">
                          Guía: {snapshot.tracking_number}
                        </p>
                      ) : null}

                      {snapshot?.carrier_name ? (
                        <p className="text-sm text-slate-600">
                          Transportadora: {snapshot.carrier_name}
                        </p>
                      ) : null}
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[420px]">
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                          Total
                        </p>
                        <p className="mt-1 text-base font-semibold text-slate-900">
                          {formatMoney(finalTotal, currency)}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                          Pago
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {getCommercialPaymentStatusLabel(order, snapshot)}
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

                  <div className="mt-5">
                    <Link
                      href={`/cuenta/pedidos/${order.id}`}
                      className="inline-flex rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Ver detalle
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}