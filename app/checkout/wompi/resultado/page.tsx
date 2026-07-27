"use client"

import Link from "next/link"
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react"
import { useSearchParams } from "next/navigation"

type ConfirmationResponse = {
  ok?: boolean
  processed?: boolean
  alreadyProcessed?: boolean
  already_processed?: boolean
  ignored?: boolean
  status?: string
  wompiStatus?: string
  wompi_status?: string
  message?: string
  error?: string
  orderId?: string
  order_id?: string
  orderDisplayId?: string | number
  order_display_id?: string | number
  reference?: string
  transactionId?: string
  transaction_id?: string
  warnings?: string[]
  [key: string]: unknown
}

type PageStatus =
  | "loading"
  | "approved"
  | "pending"
  | "declined"
  | "error"

const MAX_ATTEMPTS = 6
const RETRY_DELAY_MS = 3500

function normalizeText(value: unknown) {
  return String(value || "").trim()
}

function normalizeStatus(value: unknown) {
  return normalizeText(value).toUpperCase()
}

function wait(milliseconds: number) {
  return new Promise((resolve) =>
    window.setTimeout(resolve, milliseconds)
  )
}

function getConfirmationStatus(
  response: ConfirmationResponse
) {
  return normalizeStatus(
    response.wompiStatus ||
      response.wompi_status ||
      response.status
  )
}

function isApprovedResponse(
  response: ConfirmationResponse
) {
  const status = getConfirmationStatus(response)

  return (
    status === "APPROVED" ||
    response.processed === true ||
    response.alreadyProcessed === true ||
    response.already_processed === true ||
    Boolean(
      response.orderId ||
        response.order_id ||
        response.orderDisplayId ||
        response.order_display_id
    )
  )
}

function isPendingStatus(status: string) {
  return [
    "PENDING",
    "CREATED",
    "PROCESSING",
    "IN_PROGRESS",
  ].includes(status)
}

function isDeclinedStatus(status: string) {
  return [
    "DECLINED",
    "VOIDED",
    "ERROR",
    "FAILED",
    "CANCELLED",
    "CANCELED",
  ].includes(status)
}

export default function WompiResultadoPage() {
  const searchParams = useSearchParams()

  const transactionId =
    searchParams.get("id") ||
    searchParams.get("transaction_id") ||
    searchParams.get("transactionId") ||
    ""

  const reference =
    searchParams.get("reference") || ""

  const cartId =
    searchParams.get("cart_id") ||
    searchParams.get("cartId") ||
    ""

  const [pageStatus, setPageStatus] =
    useState<PageStatus>("loading")

  const [result, setResult] =
    useState<ConfirmationResponse | null>(null)

  const [message, setMessage] = useState(
    "Estamos confirmando tu pago y creando tu pedido."
  )

  const [attempt, setAttempt] = useState(1)

  const confirmationStarted = useRef(false)

  const confirmTransaction =
    useCallback(async () => {
      if (!transactionId) {
        setPageStatus("error")
        setMessage(
          "No recibimos el identificador de la transacción de Wompi."
        )
        return
      }

      for (
        let currentAttempt = 1;
        currentAttempt <= MAX_ATTEMPTS;
        currentAttempt += 1
      ) {
        setAttempt(currentAttempt)

        try {
          const response = await fetch(
            "/api/wompi/confirm-transaction",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              cache: "no-store",
              body: JSON.stringify({
                transactionId,
                reference: reference || undefined,
                cartId: cartId || undefined,
              }),
            }
          )

          const payload =
            (await response
              .json()
              .catch(() => null)) as
              | ConfirmationResponse
              | null

          if (!payload) {
            throw new Error(
              "El servidor no entregó una respuesta válida."
            )
          }

          setResult(payload)

          const wompiStatus =
            getConfirmationStatus(payload)

          if (isApprovedResponse(payload)) {
            setPageStatus("approved")
            setMessage(
              payload.message ||
                "Tu pago fue aprobado y tu pedido fue creado correctamente."
            )
            return
          }

          if (
            isPendingStatus(wompiStatus) ||
            payload.ignored === true
          ) {
            setPageStatus("pending")
            setMessage(
              payload.message ||
                "Wompi todavía está procesando la transacción."
            )

            if (currentAttempt < MAX_ATTEMPTS) {
              await wait(RETRY_DELAY_MS)
              continue
            }

            return
          }

          if (isDeclinedStatus(wompiStatus)) {
            setPageStatus("declined")
            setMessage(
              payload.message ||
                payload.error ||
                "El pago no fue aprobado por Wompi."
            )
            return
          }

          if (!response.ok || payload.ok === false) {
            /*
             * Algunos errores temporales pueden suceder mientras
             * Wompi termina de publicar la transacción.
             */
            if (
              currentAttempt < MAX_ATTEMPTS &&
              response.status >= 500
            ) {
              setPageStatus("loading")
              setMessage(
                "Seguimos verificando tu pago. No cierres esta ventana."
              )

              await wait(RETRY_DELAY_MS)
              continue
            }

            setPageStatus("error")
            setMessage(
              payload.error ||
                payload.message ||
                "No fue posible confirmar el pedido."
            )
            return
          }

          /*
           * Si la respuesta es válida pero no tiene todavía
           * un estado definitivo, se intenta nuevamente.
           */
          if (currentAttempt < MAX_ATTEMPTS) {
            setPageStatus("pending")
            setMessage(
              "El pago está siendo confirmado. Espera unos segundos."
            )

            await wait(RETRY_DELAY_MS)
            continue
          }

          setPageStatus("pending")
          setMessage(
            "La transacción sigue en proceso. El pedido se creará automáticamente cuando Wompi confirme el pago."
          )
          return
        } catch (error) {
          console.error(
            "[WOMPI_RESULT_PAGE] confirmation error",
            error
          )

          if (currentAttempt < MAX_ATTEMPTS) {
            setPageStatus("loading")
            setMessage(
              "Estamos intentando confirmar nuevamente tu pago."
            )

            await wait(RETRY_DELAY_MS)
            continue
          }

          setPageStatus("error")
          setMessage(
            error instanceof Error
              ? error.message
              : "No fue posible confirmar el pago."
          )
          return
        }
      }
    }, [cartId, reference, transactionId])

  useEffect(() => {
    if (confirmationStarted.current) {
      return
    }

    confirmationStarted.current = true
    void confirmTransaction()
  }, [confirmTransaction])

  const orderDisplayId =
    result?.orderDisplayId ||
    result?.order_display_id

  const confirmedReference =
    normalizeText(result?.reference) ||
    normalizeText(reference)

  const confirmedTransactionId =
    normalizeText(result?.transactionId) ||
    normalizeText(result?.transaction_id) ||
    normalizeText(transactionId)

  const warnings = Array.isArray(result?.warnings)
    ? result.warnings.filter(
        (warning): warning is string =>
          typeof warning === "string" &&
          Boolean(warning.trim())
      )
    : []

  return (
    <main className="min-h-[70vh] bg-neutral-50 px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
          <div className="border-b border-neutral-200 px-6 py-6 sm:px-8">
            <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-neutral-500">
              Resultado del pago
            </p>

            <h1 className="text-2xl font-bold text-neutral-900 sm:text-3xl">
              {pageStatus === "loading" &&
                "Confirmando tu transacción"}

              {pageStatus === "approved" &&
                "Pedido confirmado"}

              {pageStatus === "pending" &&
                "Pago en proceso"}

              {pageStatus === "declined" &&
                "Pago no aprobado"}

              {pageStatus === "error" &&
                "No pudimos confirmar el pedido"}
            </h1>
          </div>

          <div className="px-6 py-8 sm:px-8">
            <div className="flex flex-col items-center text-center">
              {pageStatus === "loading" && (
                <div
                  className="mb-6 h-14 w-14 animate-spin rounded-full border-4 border-neutral-200 border-t-neutral-900"
                  aria-label="Confirmando pago"
                />
              )}

              {pageStatus === "approved" && (
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl text-green-700">
                  ✓
                </div>
              )}

              {pageStatus === "pending" && (
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-3xl text-amber-700">
                  …
                </div>
              )}

              {pageStatus === "declined" && (
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-3xl text-red-700">
                  ×
                </div>
              )}

              {pageStatus === "error" && (
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-3xl text-red-700">
                  !
                </div>
              )}

              <p className="max-w-lg text-base leading-7 text-neutral-700">
                {message}
              </p>

              {pageStatus === "loading" && (
                <p className="mt-3 text-sm text-neutral-500">
                  Verificación {attempt} de{" "}
                  {MAX_ATTEMPTS}
                </p>
              )}

              {pageStatus === "pending" &&
                attempt < MAX_ATTEMPTS && (
                  <p className="mt-3 text-sm text-neutral-500">
                    Verificación {attempt} de{" "}
                    {MAX_ATTEMPTS}
                  </p>
                )}
            </div>

            {(orderDisplayId ||
              confirmedReference ||
              confirmedTransactionId) && (
              <div className="mt-8 rounded-xl bg-neutral-50 p-5">
                <h2 className="mb-4 font-semibold text-neutral-900">
                  Información de la transacción
                </h2>

                <dl className="space-y-3 text-sm">
                  {orderDisplayId && (
                    <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
                      <dt className="text-neutral-500">
                        Número de pedido
                      </dt>
                      <dd className="font-semibold text-neutral-900">
                        #{String(orderDisplayId)}
                      </dd>
                    </div>
                  )}

                  {confirmedReference && (
                    <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
                      <dt className="text-neutral-500">
                        Referencia
                      </dt>
                      <dd className="break-all font-medium text-neutral-900">
                        {confirmedReference}
                      </dd>
                    </div>
                  )}

                  {confirmedTransactionId && (
                    <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
                      <dt className="text-neutral-500">
                        Transacción Wompi
                      </dt>
                      <dd className="break-all font-medium text-neutral-900">
                        {confirmedTransactionId}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            )}

            {warnings.length > 0 && (
              <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5">
                <h2 className="font-semibold text-amber-900">
                  El pedido fue procesado con observaciones
                </h2>

                <div className="mt-3 space-y-2 text-sm text-amber-800">
                  {warnings.map((warning, index) => (
                    <p key={`${warning}-${index}`}>
                      {warning}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {pageStatus === "approved" && (
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Link
                  href="/cuenta/pedidos"
                  className="rounded-lg bg-neutral-900 px-6 py-3 text-center font-semibold text-white transition hover:bg-neutral-700"
                >
                  Ver mis pedidos
                </Link>

                <Link
                  href="/productos"
                  className="rounded-lg border border-neutral-300 px-6 py-3 text-center font-semibold text-neutral-900 transition hover:bg-neutral-100"
                >
                  Seguir comprando
                </Link>
              </div>
            )}

            {pageStatus === "pending" && (
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <button
                  type="button"
                  onClick={() =>
                    window.location.reload()
                  }
                  className="rounded-lg bg-neutral-900 px-6 py-3 font-semibold text-white transition hover:bg-neutral-700"
                >
                  Verificar nuevamente
                </button>

                <Link
                  href="/cuenta/pedidos"
                  className="rounded-lg border border-neutral-300 px-6 py-3 text-center font-semibold text-neutral-900 transition hover:bg-neutral-100"
                >
                  Ver mis pedidos
                </Link>
              </div>
            )}

            {(pageStatus === "declined" ||
              pageStatus === "error") && (
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Link
                  href="/checkout"
                  className="rounded-lg bg-neutral-900 px-6 py-3 text-center font-semibold text-white transition hover:bg-neutral-700"
                >
                  Volver al checkout
                </Link>

                <Link
                  href="/productos"
                  className="rounded-lg border border-neutral-300 px-6 py-3 text-center font-semibold text-neutral-900 transition hover:bg-neutral-100"
                >
                  Ir al catálogo
                </Link>
              </div>
            )}
          </div>
        </section>

        <p className="mt-5 text-center text-sm leading-6 text-neutral-500">
          No realices un segundo pago mientras esta
          transacción aparezca en proceso. La confirmación
          también se recibe automáticamente desde Wompi.
        </p>
      </div>
    </main>
  )
}