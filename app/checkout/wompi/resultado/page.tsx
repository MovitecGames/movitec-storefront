"use client"

import Link from "next/link"
import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"

type WompiTransactionResponse = {
  ok: boolean
  error?: string
  transaction?: {
    id?: string
    reference?: string
    status?: string
    status_message?: string
    amount_in_cents?: number
    currency?: string
    payment_method_type?: string
    redirect_url?: string
    finalized_at?: string
    created_at?: string
    customer_email?: string
    raw?: Record<string, any>
  }
}

type ConfirmTransactionResponse = {
  ok: boolean
  error?: string
  reference?: string
  commercial_payment_status?: string
  transaction?: {
    id?: string
    reference?: string
    status?: string
    status_message?: string
    amount_in_cents?: number
    currency?: string
    payment_method_type?: string
    finalized_at?: string
    created_at?: string
    customer_email?: string
  }
}

function formatMoneyFromCents(value?: number, currency = "COP") {
  const amount = Number(value || 0) / 100

  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

function getStatusLabel(status?: string) {
  const normalized = String(status || "").trim().toUpperCase()

  if (normalized === "APPROVED") return "Pago aprobado"
  if (normalized === "PENDING") return "Pago pendiente"
  if (normalized === "DECLINED") return "Pago rechazado"
  if (normalized === "VOIDED") return "Pago anulado"
  if (normalized === "ERROR") return "Error en el pago"

  return status ? status : "Estado no disponible"
}

function getStatusStyle(status?: string) {
  const normalized = String(status || "").trim().toUpperCase()

  if (normalized === "APPROVED") {
    return "border-emerald-200 bg-emerald-50 text-emerald-900"
  }

  if (normalized === "PENDING") {
    return "border-amber-200 bg-amber-50 text-amber-900"
  }

  if (
    normalized === "DECLINED" ||
    normalized === "VOIDED" ||
    normalized === "ERROR"
  ) {
    return "border-red-200 bg-red-50 text-red-900"
  }

  return "border-slate-200 bg-slate-50 text-slate-900"
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

function getCommercialStatusLabel(value?: string) {
  const normalized = String(value || "").trim().toLowerCase()

  if (normalized === "paid") return "Pagado"
  if (normalized === "under_review") return "Pago en validación"
  if (normalized === "rejected") return "Pago rechazado"
  if (normalized === "expired") return "Expirado"

  return "Pendiente de pago"
}

function WompiResultadoContent() {
  const searchParams = useSearchParams()

  const transactionId = String(
    searchParams.get("id") ||
      searchParams.get("transaction_id") ||
      searchParams.get("transaction-id") ||
      ""
  ).trim()

  const reference = String(searchParams.get("reference") || "").trim()

  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState("")
  const [transaction, setTransaction] =
    useState<WompiTransactionResponse["transaction"] | null>(null)
  const [commercialStatus, setCommercialStatus] = useState("")

  useEffect(() => {
    const loadTransaction = async () => {
      try {
        if (!transactionId) {
          setErrorMessage("No se recibió el identificador de la transacción.")
          setTransaction(null)
          return
        }

        setLoading(true)
        setErrorMessage("")
        setCommercialStatus("")

        const response = await fetch(
          `/api/wompi/transaction-status?id=${encodeURIComponent(transactionId)}`,
          {
            method: "GET",
            cache: "no-store",
          }
        )

        const data =
          (await response.json().catch(() => null)) as WompiTransactionResponse | null

        if (!response.ok || !data?.ok || !data.transaction) {
          setTransaction(null)
          setErrorMessage(
            data?.error || "No fue posible consultar el estado del pago."
          )
          return
        }

        setTransaction(data.transaction)

        const confirmResponse = await fetch("/api/wompi/confirm-transaction", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            transactionId,
            reference: data.transaction.reference || reference,
          }),
        })

        const confirmData =
          (await confirmResponse.json().catch(
            () => null
          )) as ConfirmTransactionResponse | null

        if (confirmResponse.ok && confirmData?.ok) {
          setCommercialStatus(
            String(confirmData.commercial_payment_status || "").trim()
          )
        }
      } catch (error) {
        console.error("[WOMPI_RESULT_PAGE] unexpected error", error)
        setTransaction(null)
        setErrorMessage("Ocurrió un error consultando el estado del pago.")
      } finally {
        setLoading(false)
      }
    }

    loadTransaction()
  }, [transactionId, reference])

  const currentStatus = String(transaction?.status || "").trim().toUpperCase()

  return (
    <main className="min-h-screen bg-neutral-50 text-slate-900">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <div className="mb-6">
          <Link
            href="/"
            className="text-sm font-medium text-slate-500 hover:text-slate-900"
          >
            ← Volver al catálogo
          </Link>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
            Resultado del pago
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            Estado de tu transacción con Wompi
          </h1>

          <p className="mt-4 text-sm text-slate-600">
            Aquí validamos el resultado real del pago contra Wompi y actualizamos
            el estado comercial del pedido.
          </p>

          {loading ? (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-700">
              Consultando transacción...
            </div>
          ) : errorMessage ? (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-900">
              {errorMessage}
            </div>
          ) : (
            <>
              <div
                className={`mt-6 rounded-2xl border p-5 ${getStatusStyle(
                  transaction?.status
                )}`}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.16em]">
                  Estado validado
                </p>
                <p className="mt-2 text-2xl font-bold">
                  {getStatusLabel(transaction?.status)}
                </p>

                {transaction?.status_message ? (
                  <p className="mt-2 text-sm opacity-90">
                    {transaction.status_message}
                  </p>
                ) : null}
              </div>

              {!!commercialStatus && (
                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Estado comercial del pedido
                  </p>
                  <p className="mt-2 text-lg font-bold text-slate-900">
                    {getCommercialStatusLabel(commercialStatus)}
                  </p>
                </div>
              )}

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-5">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                    ID de transacción Wompi
                  </p>
                  <p className="mt-2 break-all text-base font-semibold text-slate-900">
                    {transaction?.id || transactionId || "No disponible"}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-5">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                    Referencia
                  </p>
                  <p className="mt-2 break-all text-base font-semibold text-slate-900">
                    {transaction?.reference || reference || "No disponible"}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-5">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                    Valor transacción
                  </p>
                  <p className="mt-2 text-base font-semibold text-slate-900">
                    {formatMoneyFromCents(
                      transaction?.amount_in_cents,
                      String(transaction?.currency || "COP").toUpperCase()
                    )}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-5">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                    Medio de pago
                  </p>
                  <p className="mt-2 text-base font-semibold text-slate-900">
                    {transaction?.payment_method_type || "No disponible"}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-5">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                    Creada
                  </p>
                  <p className="mt-2 text-base font-semibold text-slate-900">
                    {formatDate(transaction?.created_at)}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-5">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                    Finalizada
                  </p>
                  <p className="mt-2 text-base font-semibold text-slate-900">
                    {formatDate(transaction?.finalized_at)}
                  </p>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-700">
                {currentStatus === "APPROVED" ? (
                  <p>
                    Tu pago fue aprobado. El pedido ya puede continuar al flujo de
                    validación y despacho.
                  </p>
                ) : currentStatus === "PENDING" ? (
                  <p>
                    Tu pago sigue pendiente. Aún no debe asumirse como aprobado
                    hasta que Wompi cambie el estado definitivo.
                  </p>
                ) : currentStatus === "DECLINED" ? (
                  <p>
                    Tu pago fue rechazado. Puedes intentar nuevamente con otro
                    medio de pago.
                  </p>
                ) : currentStatus === "VOIDED" ? (
                  <p>La transacción fue anulada.</p>
                ) : currentStatus === "ERROR" ? (
                  <p>
                    La transacción presentó un error y no pudo confirmarse
                    correctamente.
                  </p>
                ) : (
                  <p>
                    La transacción fue consultada, pero el estado recibido no es
                    uno de los estados esperados.
                  </p>
                )}
              </div>
            </>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/cuenta/pedidos"
              className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Ver mis pedidos
            </Link>

            <Link
              href="/checkout"
              className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Volver al checkout
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}

export default function WompiResultadoPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-neutral-50 text-slate-900">
          <div className="mx-auto max-w-4xl px-6 py-10">
            <p className="text-sm text-slate-500">
              Cargando resultado del pago…
            </p>
          </div>
        </main>
      }
    >
      <WompiResultadoContent />
    </Suspense>
  )
}