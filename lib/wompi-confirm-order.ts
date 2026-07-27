import Medusa from "@medusajs/js-sdk"
import { supabaseAdmin } from "./supabase-admin"

const medusa = new Medusa({
  baseUrl: process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL!,
  publishableKey:
    process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY!,
  debug: process.env.NODE_ENV === "development",
  auth: {
    type: "jwt",
  },
})

type WompiTransaction = {
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
  [key: string]: any
}

type ConfirmWompiOrderResult = {
  ok: boolean
  processed: boolean
  alreadyProcessed?: boolean
  processing?: boolean

  reference: string
  commercial_payment_status: string

  status?: string
  wompiStatus?: string
  message?: string
  error?: string
  warnings?: string[]

  orderId?: string
  orderDisplayId?: string | number
  publicOrderNumber?: string

  order?: {
    id: string
    display_id: string | number
    public_order_number: string
    email: string
    total: number
    currency_code: string
  }

  transaction: {
    id: string
    reference: string
    status: string
    status_message: string
    amount_in_cents: number
    currency: string
    payment_method_type: string
    finalized_at: string
    created_at: string
    customer_email: string
  }
}

function getNumber(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function normalizeWhitespace(value: unknown) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
}

function normalizeText(value: unknown) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
}

function formatMoney(
  value: number,
  currency = "COP"
) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value)
}

function mapWompiStatusToCommercialStatus(
  status?: string
) {
  const normalized = String(status || "")
    .trim()
    .toUpperCase()

  if (normalized === "APPROVED") {
    return "paid"
  }

  if (normalized === "PENDING") {
    return "under_review"
  }

  if (normalized === "DECLINED") {
    return "rejected"
  }

  if (normalized === "VOIDED") {
    return "expired"
  }

  if (normalized === "ERROR") {
    return "rejected"
  }

  return "pending"
}

function mapWompiStatusToIntentStatus(
  status?: string
) {
  const normalized = String(status || "")
    .trim()
    .toUpperCase()

  if (normalized === "APPROVED") {
    return "approved"
  }

  if (normalized === "PENDING") {
    return "pending"
  }

  if (normalized === "DECLINED") {
    return "declined"
  }

  if (normalized === "VOIDED") {
    return "voided"
  }

  if (normalized === "ERROR") {
    return "error"
  }

  return "pending"
}

function getTransactionSummary(
  transaction: WompiTransaction
) {
  return {
    id: normalizeWhitespace(transaction.id),
    reference: normalizeWhitespace(
      transaction.reference
    ),
    status: normalizeWhitespace(
      transaction.status
    ).toUpperCase(),
    status_message: normalizeWhitespace(
      transaction.status_message
    ),
    amount_in_cents: getNumber(
      transaction.amount_in_cents
    ),
    currency: normalizeWhitespace(
      transaction.currency
    ).toUpperCase(),
    payment_method_type: normalizeWhitespace(
      transaction.payment_method_type
    ),
    finalized_at: normalizeWhitespace(
      transaction.finalized_at
    ),
    created_at: normalizeWhitespace(
      transaction.created_at
    ),
    customer_email: normalizeWhitespace(
      transaction.customer_email
    ),
  }
}

function getPublicOrderNumber(
  displayId: unknown
) {
  const normalizedDisplayId =
    normalizeWhitespace(displayId)

  if (!normalizedDisplayId) {
    return ""
  }

  return `MV-${normalizedDisplayId}`
}

async function sendEmail(params: {
  to: string[]
  subject: string
  html: string
}) {
  const resendApiKey =
    process.env.RESEND_API_KEY

  const from =
    process.env.ORDER_NOTIFICATION_FROM

  if (!resendApiKey || !from) {
    return {
      sent: false,
      reason: "missing_email_env",
    }
  }

  const response = await fetch(
    "https://api.resend.com/emails",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: params.to,
        subject: params.subject,
        html: params.html,
      }),
    }
  )

  if (!response.ok) {
    const errorText = await response
      .text()
      .catch(() => "")

    throw new Error(
      `No fue posible enviar el correo. ${errorText}`
    )
  }

  return {
    sent: true,
  }
}

function buildWompiOrderEmailHtml(params: {
  title: string
  publicOrderNumber: string
  wompiReference: string
  wompiTransactionId: string
  customerEmail: string
  customerName: string
  company: string
  phone: string
  totalFormatted: string
  deliveryMode: string
  shippingAddress: string
  summary: {
    total_pvp: number
    commercial_label: string
    commercial_value: number
    total_with_commercial_terms: number
    shipping_cost: number
    retefuente_value: number
    ica_value: number
    payment_fee: number
  }
  items: Array<{
    title: string
    quantity: number
    unit_price: number
    subtotal: number
  }>
}) {
  const itemsHtml = params.items
    .map(
      (item) => `
        <tr>
          <td style="padding:8px;border:1px solid #e5e7eb;">
            ${item.title}
          </td>

          <td style="padding:8px;border:1px solid #e5e7eb;text-align:center;">
            ${item.quantity}
          </td>

          <td style="padding:8px;border:1px solid #e5e7eb;text-align:right;">
            ${formatMoney(item.unit_price)}
          </td>

          <td style="padding:8px;border:1px solid #e5e7eb;text-align:right;">
            ${formatMoney(item.subtotal)}
          </td>
        </tr>
      `
    )
    .join("")

  return `
    <div style="font-family:Arial,Helvetica,sans-serif;color:#111827;max-width:800px;margin:0 auto;">
      <h2>${params.title}</h2>

      <div style="margin-top:16px;padding:16px;border:1px solid #a7f3d0;border-radius:12px;background:#ecfdf5;">
        <p style="margin:0 0 8px 0;font-size:18px;color:#065f46;">
          <strong>Pago aprobado</strong>
        </p>

        <p style="margin:0;line-height:1.6;color:#065f46;">
          El pago fue validado correctamente con Wompi y el pedido quedó confirmado.
        </p>
      </div>

      <p style="margin-top:20px;">
        <strong>Pedido:</strong>
        ${params.publicOrderNumber}
      </p>

      <p>
        <strong>Referencia de pago Wompi:</strong>
        ${params.wompiReference || "No disponible"}
      </p>

      <p>
        <strong>Transacción Wompi:</strong>
        ${params.wompiTransactionId || "No disponible"}
      </p>

      <p>
        <strong>Cliente:</strong>
        ${params.customerName || "No registrado"}
      </p>

      <p>
        <strong>Empresa:</strong>
        ${params.company || "No registrada"}
      </p>

      <p>
        <strong>Correo:</strong>
        ${params.customerEmail || "No registrado"}
      </p>

      <p>
        <strong>Teléfono:</strong>
        ${params.phone || "No registrado"}
      </p>

      <p>
        <strong>Total pagado:</strong>
        ${params.totalFormatted}
      </p>

      <p>
        <strong>Modalidad de entrega:</strong>
        ${params.deliveryMode}
      </p>

      <p>
        <strong>Dirección / referencia:</strong>
        ${params.shippingAddress}
      </p>

      <h3 style="margin-top:24px;">
        Resumen financiero
      </h3>

      <table style="border-collapse:collapse;width:100%;">
        <tbody>
          <tr>
            <td style="padding:8px;border:1px solid #e5e7eb;">
              Total PVP
            </td>

            <td style="padding:8px;border:1px solid #e5e7eb;text-align:right;">
              ${formatMoney(
                params.summary.total_pvp
              )}
            </td>
          </tr>

          <tr>
            <td style="padding:8px;border:1px solid #e5e7eb;">
              ${params.summary.commercial_label}
            </td>

            <td style="padding:8px;border:1px solid #e5e7eb;text-align:right;">
              - ${formatMoney(
                params.summary.commercial_value
              )}
            </td>
          </tr>

          <tr>
            <td style="padding:8px;border:1px solid #e5e7eb;">
              <strong>
                Total con condición comercial
              </strong>
            </td>

            <td style="padding:8px;border:1px solid #e5e7eb;text-align:right;">
              <strong>
                ${formatMoney(
                  params.summary
                    .total_with_commercial_terms
                )}
              </strong>
            </td>
          </tr>

          <tr>
            <td style="padding:8px;border:1px solid #e5e7eb;">
              Envío
            </td>

            <td style="padding:8px;border:1px solid #e5e7eb;text-align:right;">
              ${formatMoney(
                params.summary.shipping_cost
              )}
            </td>
          </tr>

          <tr>
            <td style="padding:8px;border:1px solid #e5e7eb;">
              Retefuente
            </td>

            <td style="padding:8px;border:1px solid #e5e7eb;text-align:right;">
              - ${formatMoney(
                params.summary.retefuente_value
              )}
            </td>
          </tr>

          <tr>
            <td style="padding:8px;border:1px solid #e5e7eb;">
              ICA
            </td>

            <td style="padding:8px;border:1px solid #e5e7eb;text-align:right;">
              - ${formatMoney(
                params.summary.ica_value
              )}
            </td>
          </tr>

          <tr>
            <td style="padding:8px;border:1px solid #e5e7eb;">
              Costo adicional por pago
            </td>

            <td style="padding:8px;border:1px solid #e5e7eb;text-align:right;">
              ${formatMoney(
                params.summary.payment_fee
              )}
            </td>
          </tr>

          <tr>
            <td style="padding:8px;border:1px solid #e5e7eb;">
              <strong>Total pagado</strong>
            </td>

            <td style="padding:8px;border:1px solid #e5e7eb;text-align:right;">
              <strong>
                ${params.totalFormatted}
              </strong>
            </td>
          </tr>
        </tbody>
      </table>

      <h3 style="margin-top:24px;">
        Artículos
      </h3>

      <table style="border-collapse:collapse;width:100%;">
        <thead>
          <tr>
            <th style="padding:8px;border:1px solid #e5e7eb;text-align:left;">
              Producto
            </th>

            <th style="padding:8px;border:1px solid #e5e7eb;text-align:center;">
              Cantidad
            </th>

            <th style="padding:8px;border:1px solid #e5e7eb;text-align:right;">
              PVP unitario
            </th>

            <th style="padding:8px;border:1px solid #e5e7eb;text-align:right;">
              Subtotal
            </th>
          </tr>
        </thead>

        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <p style="margin-top:20px;line-height:1.6;">
        El pago fue aprobado y las unidades quedaron confirmadas dentro del pedido.
      </p>
    </div>
  `
}

async function saveOrderSnapshot(snapshot: {
  order_id: string
  public_order_number: string
  customer_email: string
  customer_name: string
  company: string
  phone: string
  payment_method: string
  commercial_payment_status: string
  delivery_mode: string
  shipping_address: string
  currency_code: string
  total_pvp: number
  commercial_label: string
  commercial_value: number
  total_with_commercial_terms: number
  shipping_cost: number
  retefuente_value: number
  ica_value: number
  payment_fee: number
  final_total: number
  items_json: any[]
  raw_json: Record<string, any>
}) {
  const { error } = await supabaseAdmin
    .from("b2b_order_snapshots")
    .upsert(
      {
        order_id: snapshot.order_id,
        public_order_number:
          snapshot.public_order_number,
        customer_email:
          snapshot.customer_email,
        customer_name:
          snapshot.customer_name,
        company: snapshot.company,
        phone: snapshot.phone,
        payment_method:
          snapshot.payment_method,
        commercial_payment_status:
          snapshot.commercial_payment_status,
        delivery_mode:
          snapshot.delivery_mode,
        shipping_address:
          snapshot.shipping_address,
        currency_code:
          snapshot.currency_code,
        total_pvp:
          snapshot.total_pvp,
        commercial_label:
          snapshot.commercial_label,
        commercial_value:
          snapshot.commercial_value,
        total_with_commercial_terms:
          snapshot.total_with_commercial_terms,
        shipping_cost:
          snapshot.shipping_cost,
        retefuente_value:
          snapshot.retefuente_value,
        ica_value:
          snapshot.ica_value,
        payment_fee:
          snapshot.payment_fee,
        final_total:
          snapshot.final_total,
        items_json:
          snapshot.items_json,
        raw_json:
          snapshot.raw_json,
      },
      {
        onConflict: "order_id",
      }
    )

  if (error) {
    throw new Error(
      `No fue posible guardar el snapshot del pedido. ${error.message}`
    )
  }
}

async function updatePaymentIntent(params: {
  intentId: string
  values: Record<string, any>
}) {
  const { error } = await supabaseAdmin
    .from("b2b_wompi_payment_intents")
    .update(params.values)
    .eq("id", params.intentId)

  if (error) {
    throw new Error(
      `No fue posible actualizar el intento de pago Wompi. ${error.message}`
    )
  }
}

function getDeliveryLabel(
  deliveryMode: string
) {
  if (deliveryMode === "pickup") {
    return "Recoger en bodega"
  }

  if (deliveryMode === "bogota") {
    return "Entrega en Bogotá"
  }

  return "Envío nacional"
}

export async function confirmWompiOrder(
  transaction: WompiTransaction
): Promise<ConfirmWompiOrderResult> {
  const transactionSummary =
    getTransactionSummary(transaction)

  const reference =
    transactionSummary.reference

  const commercialStatus =
    mapWompiStatusToCommercialStatus(
      transactionSummary.status
    )

  if (!reference) {
    return {
      ok: false,
      processed: false,
      reference: "",
      commercial_payment_status:
        commercialStatus,
      status: transactionSummary.status,
      wompiStatus:
        transactionSummary.status,
      error:
        "La transacción de Wompi no contiene una referencia válida.",
      transaction: transactionSummary,
    }
  }

  const {
    data: intent,
    error: lookupError,
  } = await supabaseAdmin
    .from("b2b_wompi_payment_intents")
    .select("*")
    .eq("reference", reference)
    .maybeSingle()

  if (lookupError) {
    return {
      ok: false,
      processed: false,
      reference,
      commercial_payment_status:
        commercialStatus,
      status: transactionSummary.status,
      wompiStatus:
        transactionSummary.status,
      error:
        `No fue posible consultar el intento de pago. ${lookupError.message}`,
      transaction: transactionSummary,
    }
  }

  if (!intent) {
    return {
      ok: false,
      processed: false,
      reference,
      commercial_payment_status:
        commercialStatus,
      status: transactionSummary.status,
      wompiStatus:
        transactionSummary.status,
      error:
        "No se encontró un intento de pago asociado a la referencia de Wompi.",
      transaction: transactionSummary,
    }
  }

  const expectedAmountInCents =
    getNumber(intent.amount_in_cents)

  const expectedCurrency = String(
    intent.currency || ""
  ).toUpperCase()

  if (
    expectedAmountInCents !==
    transactionSummary.amount_in_cents
  ) {
    const amountError =
      "El valor confirmado por Wompi no coincide con el valor registrado en el checkout."

    await updatePaymentIntent({
      intentId: intent.id,
      values: {
        status: "error",
        commercial_payment_status:
          "under_review",
        wompi_transaction_id:
          transactionSummary.id || null,
        wompi_status:
          transactionSummary.status,
        wompi_status_message:
          transactionSummary.status_message,
        last_error:
          amountError,
        raw_json: {
          ...(intent.raw_json || {}),
          wompi_transaction:
            transaction,
          amount_validation: {
            expected:
              expectedAmountInCents,
            received:
              transactionSummary
                .amount_in_cents,
            valid: false,
          },
        },
      },
    }).catch((error) => {
      console.error(
        "[WOMPI_CONFIRM_AMOUNT_UPDATE] unexpected error",
        error
      )
    })

    return {
      ok: false,
      processed: false,
      reference,
      commercial_payment_status:
        "under_review",
      status: transactionSummary.status,
      wompiStatus:
        transactionSummary.status,
      error: amountError,
      transaction: transactionSummary,
    }
  }

  if (
    expectedCurrency &&
    expectedCurrency !==
      transactionSummary.currency
  ) {
    const currencyError =
      "La moneda confirmada por Wompi no coincide con la moneda registrada en el checkout."

    await updatePaymentIntent({
      intentId: intent.id,
      values: {
        status: "error",
        commercial_payment_status:
          "under_review",
        wompi_transaction_id:
          transactionSummary.id || null,
        wompi_status:
          transactionSummary.status,
        wompi_status_message:
          transactionSummary.status_message,
        last_error:
          currencyError,
        raw_json: {
          ...(intent.raw_json || {}),
          wompi_transaction:
            transaction,
          currency_validation: {
            expected:
              expectedCurrency,
            received:
              transactionSummary.currency,
            valid: false,
          },
        },
      },
    }).catch((error) => {
      console.error(
        "[WOMPI_CONFIRM_CURRENCY_UPDATE] unexpected error",
        error
      )
    })

    return {
      ok: false,
      processed: false,
      reference,
      commercial_payment_status:
        "under_review",
      status: transactionSummary.status,
      wompiStatus:
        transactionSummary.status,
      error: currencyError,
      transaction: transactionSummary,
    }
  }

  if (
    transactionSummary.status !==
    "APPROVED"
  ) {
    await updatePaymentIntent({
      intentId: intent.id,
      values: {
        status:
          mapWompiStatusToIntentStatus(
            transactionSummary.status
          ),
        commercial_payment_status:
          commercialStatus,
        wompi_transaction_id:
          transactionSummary.id || null,
        wompi_status:
          transactionSummary.status,
        wompi_status_message:
          transactionSummary.status_message,
        payment_method_type:
          transactionSummary
            .payment_method_type,
        customer_email:
          transactionSummary
            .customer_email ||
          intent.customer_email ||
          null,
        confirmed_at:
          new Date().toISOString(),
        last_error:
          null,
        raw_json: {
          ...(intent.raw_json || {}),
          wompi_transaction:
            transaction,
          wompi_last_confirmation_at:
            new Date().toISOString(),
        },
      },
    })

    return {
      ok: true,
      processed: false,
      reference,
      commercial_payment_status:
        commercialStatus,
      status: transactionSummary.status,
      wompiStatus:
        transactionSummary.status,
      message:
        transactionSummary.status ===
        "PENDING"
          ? "Wompi todavía está procesando la transacción."
          : "El pago no fue aprobado por Wompi.",
      transaction: transactionSummary,
    }
  }

  if (intent.order_id) {
    const storedDisplayId =
      normalizeWhitespace(
        intent.order_display_id
      )

    const publicOrderNumber =
      getPublicOrderNumber(
        storedDisplayId
      )

    return {
      ok: true,
      processed: true,
      alreadyProcessed: true,
      reference,
      commercial_payment_status:
        "paid",
      status: "APPROVED",
      wompiStatus: "APPROVED",
      message: publicOrderNumber
        ? `Tu pago fue aprobado y el pedido ${publicOrderNumber} ya había sido creado.`
        : "Tu pago fue aprobado y el pedido ya había sido creado.",
      orderId:
        String(intent.order_id),
      orderDisplayId:
        storedDisplayId,
      publicOrderNumber,
      order: {
        id:
          String(intent.order_id),
        display_id:
          storedDisplayId,
        public_order_number:
          publicOrderNumber,
        email:
          String(
            intent.customer_email ||
              transactionSummary
                .customer_email ||
              ""
          ),
        total:
          transactionSummary
            .amount_in_cents / 100,
        currency_code:
          transactionSummary.currency ||
          "COP",
      },
      transaction: transactionSummary,
    }
  }

  const processingStartedAt =
    intent.processing_started_at
      ? new Date(
          intent.processing_started_at
        ).getTime()
      : 0

  const processingIsRecent =
    String(intent.status || "")
      .toLowerCase() ===
      "processing" &&
    processingStartedAt > 0 &&
    Date.now() -
      processingStartedAt <
      90_000

  if (processingIsRecent) {
    return {
      ok: true,
      processed: false,
      processing: true,
      reference,
      commercial_payment_status:
        "under_review",
      status: "APPROVED",
      wompiStatus: "APPROVED",
      message:
        "El pago fue aprobado y el pedido está siendo creado.",
      transaction: transactionSummary,
    }
  }

  const processingTimestamp =
    new Date().toISOString()

  await updatePaymentIntent({
    intentId: intent.id,
    values: {
      status: "processing",
      commercial_payment_status:
        "under_review",
      processing_started_at:
        processingTimestamp,
      confirmed_at:
        processingTimestamp,
      wompi_transaction_id:
        transactionSummary.id || null,
      wompi_status:
        transactionSummary.status,
      wompi_status_message:
        transactionSummary.status_message,
      payment_method_type:
        transactionSummary
          .payment_method_type,
      customer_email:
        transactionSummary
          .customer_email ||
        intent.customer_email ||
        null,
      last_error:
        null,
      raw_json: {
        ...(intent.raw_json || {}),
        wompi_transaction:
          transaction,
        wompi_processing_started_at:
          processingTimestamp,
      },
    },
  })

  const cartId =
    normalizeWhitespace(
      intent.cart_id
    )

  if (!cartId) {
    const cartError =
      "El intento de pago no contiene un cartId válido."

    await updatePaymentIntent({
      intentId: intent.id,
      values: {
        status: "error",
        commercial_payment_status:
          "under_review",
        last_error:
          cartError,
      },
    })

    return {
      ok: false,
      processed: false,
      reference,
      commercial_payment_status:
        "under_review",
      status: "APPROVED",
      wompiStatus: "APPROVED",
      error: cartError,
      transaction: transactionSummary,
    }
  }

  try {
    const { cart } =
      await medusa.store.cart.retrieve(
        cartId,
        {
          fields:
            "*items,+items.metadata,+items.variant,+items.variant.metadata,+metadata,+shipping_address,+billing_address,+shipping_methods",
        } as any
      )

    const metadata =
      (cart as any)?.metadata || {}

    const paymentMethod = String(
      metadata.payment_method || ""
    )
      .trim()
      .toLowerCase()

    if (paymentMethod !== "wompi") {
      throw new Error(
        "El carrito asociado no tiene Wompi como método de pago."
      )
    }

    const deliveryMode = String(
      metadata.delivery_mode ||
        "pickup"
    )

    const totalPvp = getNumber(
      metadata.checkout_total_pvp ??
        metadata.cart_total_pvp ??
        0
    )

    const commercialLabel = String(
      metadata.checkout_commercial_label ??
        metadata.cart_commercial_label ??
        "Condición comercial"
    )

    const commercialValue = getNumber(
      metadata.checkout_commercial_value ??
        metadata.cart_commercial_value ??
        0
    )

    const totalWithCommercialTerms =
      getNumber(
        metadata
          .checkout_total_with_commercial_terms ??
          metadata
            .cart_total_with_commercial_terms ??
          0
      )

    const shippingCost = getNumber(
      metadata.checkout_shipping_cost ??
        metadata.selected_shipping_price ??
        0
    )

    const paymentFee = getNumber(
      metadata.checkout_payment_fee ??
        metadata.payment_fee_value ??
        0
    )

    const retefuenteValue = getNumber(
      metadata
        .checkout_retefuente_value ??
        metadata.retefuente_value ??
        0
    )

    const icaValue = getNumber(
      metadata.checkout_ica_value ??
        metadata.ica_value ??
        0
    )

    const finalTotal = getNumber(
      metadata.checkout_final_total ??
        metadata
          .cart_final_payable_total ??
        (
          totalWithCommercialTerms +
          shippingCost -
          retefuenteValue -
          icaValue +
          paymentFee
        )
    )

    const calculatedAmountInCents =
      Math.round(finalTotal) * 100

    if (
      calculatedAmountInCents !==
      transactionSummary.amount_in_cents
    ) {
      throw new Error(
        "El total actual del carrito no coincide con el valor aprobado por Wompi."
      )
    }

    const optionsResponse =
      await medusa.store.fulfillment
        .listCartOptions({
          cart_id: cartId,
        } as any)

    const options = Array.isArray(
      (optionsResponse as any)
        ?.shipping_options
    )
      ? (optionsResponse as any)
          .shipping_options
      : Array.isArray(optionsResponse)
      ? optionsResponse
      : []

    const targetOption =
      options.find((option: any) => {
        const optionName =
          normalizeText(option?.name)

        const typeLabel =
          normalizeText(
            option
              ?.shipping_option_type
              ?.label
          )

        const typeCode =
          normalizeText(
            option
              ?.shipping_option_type
              ?.code
          )

        if (
          deliveryMode === "pickup"
        ) {
          return (
            optionName.includes(
              "recoger"
            ) ||
            optionName.includes(
              "recogida"
            ) ||
            optionName.includes(
              "bodega"
            ) ||
            typeLabel.includes(
              "recogida"
            ) ||
            typeCode.includes(
              "recogida"
            )
          )
        }

        if (
          deliveryMode === "bogota"
        ) {
          return (
            optionName.includes(
              "bogota"
            ) ||
            typeLabel.includes(
              "bogota"
            ) ||
            typeCode.includes(
              "bogota"
            )
          )
        }

        if (
          deliveryMode === "nacional"
        ) {
          return (
            optionName.includes(
              "nacional"
            ) ||
            typeLabel.includes(
              "nacional"
            ) ||
            typeCode.includes(
              "nacional"
            )
          )
        }

        return false
      })

    if (!targetOption?.id) {
      throw new Error(
        "No se encontró una shipping option válida para la modalidad de entrega seleccionada."
      )
    }

    const currentShippingMethods =
      Array.isArray(
        (cart as any)
          ?.shipping_methods
      )
        ? (cart as any)
            .shipping_methods
        : []

    const alreadyAssigned =
      currentShippingMethods.some(
        (method: any) =>
          method?.shipping_option_id ===
          targetOption.id
      )

    if (!alreadyAssigned) {
      await medusa.store.cart
        .addShippingMethod(
          cartId,
          {
            option_id:
              targetOption.id,
          } as any
        )
    }

    /*
     * Medusa se utiliza para crear la orden
     * y descontar el inventario.
     *
     * Wompi ya procesó el dinero.
     * pp_system_default no realiza un segundo cobro.
     */
    await medusa.store.payment
      .initiatePaymentSession(
        cart as any,
        {
          provider_id:
            "pp_system_default",
        }
      )

    const completion =
      await medusa.store.cart.complete(
        cartId
      )

    if (
      completion.type === "cart" ||
      !completion.order
    ) {
      throw new Error(
        completion.error?.message ||
          "No fue posible completar el carrito y crear la orden."
      )
    }

    const order =
      completion.order as any

    const orderDisplayId =
      order.display_id

    /*
     * La numeración pública se toma
     * exclusivamente de la secuencia de Medusa.
     *
     * Ejemplo:
     * display_id = 58
     * número público = MV-58
     */
    const publicOrderNumber =
      getPublicOrderNumber(
        orderDisplayId
      )

    if (!publicOrderNumber) {
      throw new Error(
        "Medusa creó la orden, pero no entregó un display_id válido."
      )
    }

    const customerName = [
      cart?.shipping_address
        ?.first_name || "",
      cart?.shipping_address
        ?.last_name || "",
    ]
      .filter(Boolean)
      .join(" ")

    const shippingAddress =
      deliveryMode === "pickup"
        ? String(
            metadata
              .pickup_instructions ||
              "Recoger en bodega"
          )
        : [
            cart?.shipping_address
              ?.address_1 || "",
            cart?.shipping_address
              ?.city || "",
            cart?.shipping_address
              ?.province || "",
            cart?.shipping_address
              ?.postal_code || "",
          ]
            .filter(Boolean)
            .join(", ")

    const orderItems =
      (cart?.items || []).map(
        (item: any) => ({
          title: String(
            item?.title ||
              "Producto"
          ),
          quantity: Number(
            item?.quantity || 0
          ),
          unit_price: Number(
            item?.unit_price || 0
          ),
          subtotal:
            Number(
              item?.unit_price || 0
            ) *
            Number(
              item?.quantity || 0
            ),
        })
      )

    const orderPayload = {
      id: String(order.id),
      display_id:
        orderDisplayId,
      public_order_number:
        publicOrderNumber,
      email: String(
        cart?.email || ""
      ),
      total: finalTotal,
      currency_code: String(
        cart?.currency_code
          ?.toUpperCase() ||
          "COP"
      ),
      summary: {
        total_pvp:
          totalPvp,
        commercial_label:
          commercialLabel,
        commercial_value:
          commercialValue,
        total_with_commercial_terms:
          totalWithCommercialTerms,
        shipping_cost:
          shippingCost,
        retefuente_value:
          retefuenteValue,
        ica_value:
          icaValue,
        payment_fee:
          paymentFee,
      },
      customer: {
        name:
          customerName,
        company: String(
          cart?.shipping_address
            ?.company || ""
        ),
        phone: String(
          cart?.shipping_address
            ?.phone || ""
        ),
        email: String(
          cart?.email || ""
        ),
      },
      delivery: {
        mode:
          deliveryMode,
        instructions: String(
          metadata
            .pickup_instructions ||
            ""
        ),
        address: String(
          cart?.shipping_address
            ?.address_1 || ""
        ),
        city: String(
          cart?.shipping_address
            ?.city || ""
        ),
        province: String(
          cart?.shipping_address
            ?.province || ""
        ),
        postal_code: String(
          cart?.shipping_address
            ?.postal_code || ""
        ),
        shipping_label: String(
          metadata
            .selected_shipping_label ||
            ""
        ),
      },
      items:
        orderItems,
      wompi: {
        reference,
        transaction_id:
          transactionSummary.id,
        status:
          transactionSummary.status,
        payment_method_type:
          transactionSummary
            .payment_method_type,
      },
    }

    await updatePaymentIntent({
      intentId: intent.id,
      values: {
        status: "approved",
        commercial_payment_status:
          "paid",
        order_id:
          orderPayload.id,
        order_display_id:
          String(
            orderPayload.display_id
          ),
        confirmed_at:
          new Date().toISOString(),
        last_error:
          null,
        raw_json: {
          ...(intent.raw_json || {}),
          wompi_transaction:
            transaction,
          order:
            orderPayload,
          medusa_order_created_at:
            new Date().toISOString(),
        },
      },
    })

    const warnings: string[] = []

    let snapshotSaved = false
    let salesEmailSent = false
    let customerEmailSent = false

    try {
      await saveOrderSnapshot({
        order_id:
          orderPayload.id,
        public_order_number:
          orderPayload
            .public_order_number,
        customer_email:
          orderPayload.customer
            .email || "",
        customer_name:
          orderPayload.customer
            .name || "",
        company:
          orderPayload.customer
            .company || "",
        phone:
          orderPayload.customer
            .phone || "",
        payment_method:
          "wompi",
        commercial_payment_status:
          "paid",
        delivery_mode:
          deliveryMode,
        shipping_address:
          shippingAddress,
        currency_code:
          orderPayload
            .currency_code,
        total_pvp:
          totalPvp,
        commercial_label:
          commercialLabel,
        commercial_value:
          commercialValue,
        total_with_commercial_terms:
          totalWithCommercialTerms,
        shipping_cost:
          shippingCost,
        retefuente_value:
          retefuenteValue,
        ica_value:
          icaValue,
        payment_fee:
          paymentFee,
        final_total:
          finalTotal,
        items_json:
          orderPayload.items,
        raw_json:
          orderPayload,
      })

      snapshotSaved = true
    } catch (snapshotError) {
      const message =
        snapshotError instanceof Error
          ? snapshotError.message
          : "No fue posible guardar el snapshot."

      warnings.push(message)

      console.error(
        "[WOMPI_ORDER_SNAPSHOT] unexpected error",
        snapshotError
      )
    }

    try {
      const summaryForEmail = {
        total_pvp:
          totalPvp,
        commercial_label:
          commercialLabel,
        commercial_value:
          commercialValue,
        total_with_commercial_terms:
          totalWithCommercialTerms,
        shipping_cost:
          shippingCost,
        retefuente_value:
          retefuenteValue,
        ica_value:
          icaValue,
        payment_fee:
          paymentFee,
      }

      const deliveryLabel =
        getDeliveryLabel(
          deliveryMode
        )

      const salesHtml =
        buildWompiOrderEmailHtml({
          title:
            "Nuevo pedido B2B pagado con Wompi",
          publicOrderNumber,
          wompiReference:
            reference,
          wompiTransactionId:
            transactionSummary.id,
          customerEmail:
            orderPayload.customer
              .email || "",
          customerName:
            orderPayload.customer
              .name || "",
          company:
            orderPayload.customer
              .company || "",
          phone:
            orderPayload.customer
              .phone || "",
          totalFormatted:
            formatMoney(
              finalTotal,
              orderPayload
                .currency_code
            ),
          deliveryMode:
            deliveryLabel,
          shippingAddress,
          summary:
            summaryForEmail,
          items:
            orderPayload.items,
        })

      const customerHtml =
        buildWompiOrderEmailHtml({
          title:
            "Tu pedido B2B fue confirmado",
          publicOrderNumber,
          wompiReference:
            reference,
          wompiTransactionId:
            transactionSummary.id,
          customerEmail:
            orderPayload.customer
              .email || "",
          customerName:
            orderPayload.customer
              .name || "",
          company:
            orderPayload.customer
              .company || "",
          phone:
            orderPayload.customer
              .phone || "",
          totalFormatted:
            formatMoney(
              finalTotal,
              orderPayload
                .currency_code
            ),
          deliveryMode:
            deliveryLabel,
          shippingAddress,
          summary:
            summaryForEmail,
          items:
            orderPayload.items,
        })

      const salesRecipient =
        process.env
          .ORDER_NOTIFICATION_TO ||
        "ventas@movitecgames.com"

      const salesResult =
        await sendEmail({
          to: [
            salesRecipient,
          ],
          subject:
            `Pedido Wompi aprobado - ${publicOrderNumber}`,
          html:
            salesHtml,
        })

      salesEmailSent =
        salesResult.sent

      if (!salesResult.sent) {
        warnings.push(
          "No se envió el correo interno porque faltan variables de correo."
        )
      }

      if (
        orderPayload.customer.email
      ) {
        const customerResult =
          await sendEmail({
            to: [
              orderPayload.customer
                .email,
            ],
            subject:
              `Confirmación de pedido - ${publicOrderNumber}`,
            html:
              customerHtml,
          })

        customerEmailSent =
          customerResult.sent

        if (
          !customerResult.sent
        ) {
          warnings.push(
            "No se envió el correo al cliente porque faltan variables de correo."
          )
        }
      }
    } catch (emailError) {
      const message =
        emailError instanceof Error
          ? emailError.message
          : "No fue posible enviar los correos."

      warnings.push(message)

      console.error(
        "[WOMPI_ORDER_EMAIL] unexpected error",
        emailError
      )
    }

    const processedAt =
      new Date().toISOString()

    await updatePaymentIntent({
      intentId: intent.id,
      values: {
        status: "processed",
        commercial_payment_status:
          "paid",
        processed_at:
          processedAt,
        last_error:
          warnings.length > 0
            ? warnings.join(" | ")
            : null,
        raw_json: {
          ...(intent.raw_json || {}),
          wompi_transaction:
            transaction,
          order:
            orderPayload,
          processing_result: {
            snapshot_saved:
              snapshotSaved,
            sales_email_sent:
              salesEmailSent,
            customer_email_sent:
              customerEmailSent,
            warnings,
            processed_at:
              processedAt,
          },
        },
      },
    })

    return {
      ok: true,
      processed: true,
      reference,
      commercial_payment_status:
        "paid",
      status: "APPROVED",
      wompiStatus: "APPROVED",
      message:
        `Tu pago fue aprobado y el pedido ${publicOrderNumber} fue creado correctamente.`,
      warnings,

      orderId:
        orderPayload.id,

      orderDisplayId:
        orderPayload.display_id,

      publicOrderNumber:
        orderPayload
          .public_order_number,

      order: {
        id:
          orderPayload.id,
        display_id:
          orderPayload.display_id,
        public_order_number:
          orderPayload
            .public_order_number,
        email:
          orderPayload.email,
        total:
          orderPayload.total,
        currency_code:
          orderPayload
            .currency_code,
      },

      transaction:
        transactionSummary,
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Ocurrió un error creando la orden en Medusa."

    console.error(
      "[WOMPI_CONFIRM_ORDER] unexpected error",
      error
    )

    await updatePaymentIntent({
      intentId: intent.id,
      values: {
        status: "error",
        commercial_payment_status:
          "under_review",
        last_error:
          errorMessage,
        raw_json: {
          ...(intent.raw_json || {}),
          wompi_transaction:
            transaction,
          wompi_processing_error: {
            message:
              errorMessage,
            occurred_at:
              new Date().toISOString(),
          },
        },
      },
    }).catch((updateError) => {
      console.error(
        "[WOMPI_CONFIRM_ORDER_ERROR_UPDATE] unexpected error",
        updateError
      )
    })

    return {
      ok: false,
      processed: false,
      reference,
      commercial_payment_status:
        "under_review",
      status:
        transactionSummary.status,
      wompiStatus:
        transactionSummary.status,
      error:
        errorMessage,
      transaction:
        transactionSummary,
    }
  }
}