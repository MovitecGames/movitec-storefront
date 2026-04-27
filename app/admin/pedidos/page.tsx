"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

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

const PAYMENT_STATUS_OPTIONS = [
  { value: "pending", label: "Pendiente de pago" },
  { value: "under_review", label: "Pago en validación" },
  { value: "paid", label: "Pagado" },
  { value: "rejected", label: "Pago rechazado" },
  { value: "expired", label: "Expirado" },
]

const DELIVERY_STATUS_OPTIONS = [
  { value: "pending_preparation", label: "Pendiente de alistamiento" },
  { value: "ready_for_pickup", label: "Listo para recoger" },
  { value: "picked_up", label: "Recogido en bodega" },
  { value: "shipped", label: "Despachado" },
  { value: "delivered", label: "Entregado" },
  { value: "cancelled", label: "Cancelado" },
]

type DeliveryDraft = {
  delivery_status: string
  carrier_name: string
  tracking_number: string
  shipped_at: string
  delivered_at: string
  delivered_to: string
  delivery_notes: string
  picked_up_by: string
  picked_up_at: string
}

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDate(value?: string | null) {
  if (!value) return "No disponible"

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return "No disponible"

  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}

function formatInputDateTime(value?: string | null) {
  if (!value) return ""

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")

  return `${year}-${month}-${day}T${hours}:${minutes}`
}

function getPaymentStatusLabel(value?: string | null) {
  const normalized = String(value || "").trim().toLowerCase()
  const option = PAYMENT_STATUS_OPTIONS.find((item) => item.value === normalized)
  return option?.label || "Pendiente de pago"
}

function getDeliveryStatusLabel(value?: string | null) {
  const normalized = String(value || "").trim().toLowerCase()
  const option = DELIVERY_STATUS_OPTIONS.find((item) => item.value === normalized)
  return option?.label || "Pendiente de alistamiento"
}

function buildDeliveryDraft(item: SnapshotItem): DeliveryDraft {
  return {
    delivery_status: String(item.delivery_status || "pending_preparation"),
    carrier_name: String(item.carrier_name || ""),
    tracking_number: String(item.tracking_number || ""),
    shipped_at: formatInputDateTime(item.shipped_at),
    delivered_at: formatInputDateTime(item.delivered_at),
    delivered_to: String(item.delivered_to || ""),
    delivery_notes: String(item.delivery_notes || ""),
    picked_up_by: String(item.picked_up_by || ""),
    picked_up_at: formatInputDateTime(item.picked_up_at),
  }
}

export default function AdminPedidosPage() {
  const [snapshots, setSnapshots] = useState<SnapshotItem[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState("")
  const [savingPaymentOrderId, setSavingPaymentOrderId] = useState("")
  const [savingDeliveryOrderId, setSavingDeliveryOrderId] = useState("")
  const [paymentStatusDrafts, setPaymentStatusDrafts] = useState<Record<string, string>>({})
  const [deliveryDrafts, setDeliveryDrafts] = useState<Record<string, DeliveryDraft>>({})

  async function loadSnapshots() {
    try {
      setLoading(true)
      setErrorMessage("")

      const response = await fetch("/api/b2b/order-snapshots", {
        method: "GET",
        cache: "no-store",
      })

      const data = await response.json().catch(() => null)

      if (!response.ok || !data?.ok) {
        setSnapshots([])
        setErrorMessage(data?.error || "No fue posible cargar los pedidos.")
        return
      }

      const loadedSnapshots = Array.isArray(data?.snapshots)
        ? (data.snapshots as SnapshotItem[])
        : []

      setSnapshots(loadedSnapshots)

      const nextPaymentDrafts: Record<string, string> = {}
      const nextDeliveryDrafts: Record<string, DeliveryDraft> = {}

      for (const item of loadedSnapshots) {
        nextPaymentDrafts[item.order_id] = String(
          item.commercial_payment_status || "pending"
        )
        nextDeliveryDrafts[item.order_id] = buildDeliveryDraft(item)
      }

      setPaymentStatusDrafts(nextPaymentDrafts)
      setDeliveryDrafts(nextDeliveryDrafts)
    } catch (error) {
      console.error("[ADMIN_PEDIDOS_PAGE] unexpected error", error)
      setSnapshots([])
      setErrorMessage("Ocurrió un error cargando los pedidos.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSnapshots()
  }, [])

  async function handleSavePaymentStatus(orderId: string) {
    try {
      const nextStatus = String(paymentStatusDrafts[orderId] || "pending").trim()

      setSavingPaymentOrderId(orderId)

      const response = await fetch("/api/b2b/order-snapshots/update-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          order_id: orderId,
          commercial_payment_status: nextStatus,
        }),
      })

      const data = await response.json().catch(() => null)

      if (!response.ok || !data?.ok) {
        alert(data?.error || "No fue posible actualizar el estado del pago.")
        return
      }

      await loadSnapshots()
      alert("Estado de pago actualizado correctamente.")
    } catch (error) {
      console.error("[ADMIN_PEDIDOS_SAVE_PAYMENT] unexpected error", error)
      alert("Ocurrió un error actualizando el estado del pago.")
    } finally {
      setSavingPaymentOrderId("")
    }
  }

  async function handleSaveDelivery(orderId: string) {
    try {
      const draft = deliveryDrafts[orderId]

      setSavingDeliveryOrderId(orderId)

      const response = await fetch("/api/b2b/order-snapshots/update-delivery", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          order_id: orderId,
          delivery_status: draft?.delivery_status || "pending_preparation",
          carrier_name: draft?.carrier_name || "",
          tracking_number: draft?.tracking_number || "",
          shipped_at: draft?.shipped_at || "",
          delivered_at: draft?.delivered_at || "",
          delivered_to: draft?.delivered_to || "",
          delivery_notes: draft?.delivery_notes || "",
          picked_up_by: draft?.picked_up_by || "",
          picked_up_at: draft?.picked_up_at || "",
        }),
      })

      const data = await response.json().catch(() => null)

      if (!response.ok || !data?.ok) {
        alert(data?.error || "No fue posible actualizar el despacho.")
        return
      }

      await loadSnapshots()
      alert("Despacho actualizado correctamente.")
    } catch (error) {
      console.error("[ADMIN_PEDIDOS_SAVE_DELIVERY] unexpected error", error)
      alert("Ocurrió un error actualizando el despacho.")
    } finally {
      setSavingDeliveryOrderId("")
    }
  }

  async function handleLogout() {
    try {
      await fetch("/api/admin/logout", {
        method: "POST",
      })
    } catch (error) {
      console.error("[ADMIN_PEDIDOS_LOGOUT] unexpected error", error)
    } finally {
      window.location.href = "/admin/login"
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-neutral-50 text-slate-900">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <p className="text-sm text-slate-500">Cargando pedidos internos…</p>
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

          <button
            type="button"
            onClick={handleLogout}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cerrar sesión
          </button>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
            Administración comercial
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            Gestión de pedidos B2B
          </h1>

          <p className="mt-3 text-sm text-slate-600">
            Aquí puedes revisar los pedidos guardados y actualizar pago y despacho.
          </p>
        </div>

        {errorMessage ? (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            {errorMessage}
          </div>
        ) : null}

        {!snapshots.length ? (
          <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
            <h2 className="text-xl font-bold">No hay pedidos guardados</h2>
            <p className="mt-2 text-slate-600">
              Cuando se confirmen nuevos pedidos, aparecerán aquí.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {snapshots.map((item) => {
              const currency = String(item.currency_code || "COP").toUpperCase()
              const paymentDraftValue = String(
                paymentStatusDrafts[item.order_id] || item.commercial_payment_status || "pending"
              )
              const deliveryDraft = deliveryDrafts[item.order_id] || buildDeliveryDraft(item)

              return (
                <div
                  key={item.order_id}
                  className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Pedido
                      </p>

                      <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                        {item.public_order_number || item.order_id}
                      </h2>

                      <p className="text-sm text-slate-600">
                        Fecha: {formatDate(item.created_at)}
                      </p>

                      <p className="text-sm text-slate-600">
                        Cliente: {item.customer_name || item.customer_email || "No registrado"}
                      </p>

                      <p className="text-sm text-slate-600">
                        Empresa: {item.company || "No registrada"}
                      </p>

                      <p className="text-sm text-slate-600">
                        Método de pago: {item.payment_method || "No definido"}
                      </p>

                      <p className="text-sm text-slate-600">
                        Dirección: {item.shipping_address || "No registrada"}
                      </p>

                      <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                        <p>
                          <span className="font-semibold text-slate-900">Order ID:</span>{" "}
                          {item.order_id}
                        </p>
                        <p className="mt-1">
                          <span className="font-semibold text-slate-900">Estado logístico actual:</span>{" "}
                          {getDeliveryStatusLabel(item.delivery_status)}
                        </p>
                        <p className="mt-1">
                          <span className="font-semibold text-slate-900">Transportadora:</span>{" "}
                          {item.carrier_name || "No registrada"}
                        </p>
                        <p className="mt-1">
                          <span className="font-semibold text-slate-900">Guía:</span>{" "}
                          {item.tracking_number || "No registrada"}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl bg-slate-50 p-4">
                          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                            Total real
                          </p>
                          <p className="mt-1 text-base font-semibold text-slate-900">
                            {formatMoney(Number(item.final_total || 0), currency)}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-slate-50 p-4">
                          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                            Estado actual
                          </p>
                          <p className="mt-1 text-sm font-semibold text-slate-900">
                            {getPaymentStatusLabel(item.commercial_payment_status)}
                          </p>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-200 p-4">
                        <p className="text-sm font-semibold text-slate-900">
                          Actualizar estado del pago
                        </p>

                        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                          <select
                            value={paymentDraftValue}
                            onChange={(e) =>
                              setPaymentStatusDrafts((prev) => ({
                                ...prev,
                                [item.order_id]: e.target.value,
                              }))
                            }
                            className="rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900"
                          >
                            {PAYMENT_STATUS_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>

                          <button
                            onClick={() => handleSavePaymentStatus(item.order_id)}
                            disabled={savingPaymentOrderId === item.order_id}
                            className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
                          >
                            {savingPaymentOrderId === item.order_id
                              ? "Guardando..."
                              : "Guardar estado"}
                          </button>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-200 p-4">
                        <p className="text-sm font-semibold text-slate-900">
                          Gestión de despacho
                        </p>

                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          <div>
                            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                              Estado logístico
                            </label>
                            <select
                              value={deliveryDraft.delivery_status}
                              onChange={(e) =>
                                setDeliveryDrafts((prev) => ({
                                  ...prev,
                                  [item.order_id]: {
                                    ...deliveryDraft,
                                    delivery_status: e.target.value,
                                  },
                                }))
                              }
                              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900"
                            >
                              {DELIVERY_STATUS_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                              Transportadora
                            </label>
                            <input
                              value={deliveryDraft.carrier_name}
                              onChange={(e) =>
                                setDeliveryDrafts((prev) => ({
                                  ...prev,
                                  [item.order_id]: {
                                    ...deliveryDraft,
                                    carrier_name: e.target.value,
                                  },
                                }))
                              }
                              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900"
                            />
                          </div>

                          <div>
                            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                              Número de guía
                            </label>
                            <input
                              value={deliveryDraft.tracking_number}
                              onChange={(e) =>
                                setDeliveryDrafts((prev) => ({
                                  ...prev,
                                  [item.order_id]: {
                                    ...deliveryDraft,
                                    tracking_number: e.target.value,
                                  },
                                }))
                              }
                              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900"
                            />
                          </div>

                          <div>
                            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                              Fecha de despacho
                            </label>
                            <input
                              type="datetime-local"
                              value={deliveryDraft.shipped_at}
                              onChange={(e) =>
                                setDeliveryDrafts((prev) => ({
                                  ...prev,
                                  [item.order_id]: {
                                    ...deliveryDraft,
                                    shipped_at: e.target.value,
                                  },
                                }))
                              }
                              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900"
                            />
                          </div>

                          <div>
                            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                              Recibido / recogido por
                            </label>
                            <input
                              value={deliveryDraft.delivered_to}
                              onChange={(e) =>
                                setDeliveryDrafts((prev) => ({
                                  ...prev,
                                  [item.order_id]: {
                                    ...deliveryDraft,
                                    delivered_to: e.target.value,
                                  },
                                }))
                              }
                              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900"
                            />
                          </div>

                          <div>
                            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                              Fecha de entrega
                            </label>
                            <input
                              type="datetime-local"
                              value={deliveryDraft.delivered_at}
                              onChange={(e) =>
                                setDeliveryDrafts((prev) => ({
                                  ...prev,
                                  [item.order_id]: {
                                    ...deliveryDraft,
                                    delivered_at: e.target.value,
                                  },
                                }))
                              }
                              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900"
                            />
                          </div>

                          <div>
                            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                              Recogido en bodega por
                            </label>
                            <input
                              value={deliveryDraft.picked_up_by}
                              onChange={(e) =>
                                setDeliveryDrafts((prev) => ({
                                  ...prev,
                                  [item.order_id]: {
                                    ...deliveryDraft,
                                    picked_up_by: e.target.value,
                                  },
                                }))
                              }
                              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900"
                            />
                          </div>

                          <div>
                            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                              Fecha de recogida
                            </label>
                            <input
                              type="datetime-local"
                              value={deliveryDraft.picked_up_at}
                              onChange={(e) =>
                                setDeliveryDrafts((prev) => ({
                                  ...prev,
                                  [item.order_id]: {
                                    ...deliveryDraft,
                                    picked_up_at: e.target.value,
                                  },
                                }))
                              }
                              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900"
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                              Observaciones logísticas
                            </label>
                            <textarea
                              value={deliveryDraft.delivery_notes}
                              onChange={(e) =>
                                setDeliveryDrafts((prev) => ({
                                  ...prev,
                                  [item.order_id]: {
                                    ...deliveryDraft,
                                    delivery_notes: e.target.value,
                                  },
                                }))
                              }
                              rows={4}
                              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900"
                            />
                          </div>
                        </div>

                        <div className="mt-4">
                          <button
                            onClick={() => handleSaveDelivery(item.order_id)}
                            disabled={savingDeliveryOrderId === item.order_id}
                            className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
                          >
                            {savingDeliveryOrderId === item.order_id
                              ? "Guardando despacho..."
                              : "Guardar despacho"}
                          </button>
                        </div>
                      </div>
                    </div>
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