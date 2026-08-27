import { NextResponse } from "next/server"
import Medusa from "@medusajs/js-sdk"
import { supabaseAdmin } from "../../../../lib/supabase-admin"

const medusa = new Medusa({
  baseUrl: process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL!,
  publishableKey: process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY!,
  debug: process.env.NODE_ENV === "development",
  auth: {
    type: "jwt",
  },
})

function getNumber(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function formatMoney(value: number, currency = "COP") {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value)
}

function normalizeText(value: unknown) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
}

async function sendEmail(params: {
  to: string[]
  subject: string
  html: string
}) {
  const resendApiKey = process.env.RESEND_API_KEY
  const from = process.env.ORDER_NOTIFICATION_FROM

  if (!resendApiKey || !from) {
    return { sent: false, reason: "missing_email_env" }
  }

  const response = await fetch("https://api.resend.com/emails", {
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
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => "")
    throw new Error(`No fue posible enviar el correo. ${errorText}`)
  }

  return { sent: true }
}

function buildOrderEmailHtml(params: {
  title: string
  publicOrderNumber: string
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
          <td style="padding:8px;border:1px solid #e5e7eb;">${item.title}</td>
          <td style="padding:8px;border:1px solid #e5e7eb;text-align:center;">${item.quantity}</td>
          <td style="padding:8px;border:1px solid #e5e7eb;text-align:right;">${formatMoney(item.unit_price)}</td>
          <td style="padding:8px;border:1px solid #e5e7eb;text-align:right;">${formatMoney(item.subtotal)}</td>
        </tr>
      `
    )
    .join("")

  return `
    <div style="font-family:Arial,Helvetica,sans-serif;color:#111827;max-width:800px;margin:0 auto;">
      <h2>${params.title}</h2>

      <p><strong>Pedido:</strong> ${params.publicOrderNumber}</p>
      <p><strong>Cliente:</strong> ${params.customerName || "No registrado"}</p>
      <p><strong>Empresa:</strong> ${params.company || "No registrada"}</p>
      <p><strong>Correo:</strong> ${params.customerEmail || "No registrado"}</p>
      <p><strong>Teléfono:</strong> ${params.phone || "No registrado"}</p>
      <p><strong>Total a pagar:</strong> ${params.totalFormatted}</p>
      <p><strong>Modalidad de entrega:</strong> ${params.deliveryMode}</p>
      <p><strong>Dirección / referencia:</strong> ${params.shippingAddress}</p>

      <h3 style="margin-top:24px;">Resumen financiero</h3>
      <table style="border-collapse:collapse;width:100%;">
        <tbody>
          <tr>
            <td style="padding:8px;border:1px solid #e5e7eb;">Total PVP</td>
            <td style="padding:8px;border:1px solid #e5e7eb;text-align:right;">${formatMoney(params.summary.total_pvp)}</td>
          </tr>
          <tr>
            <td style="padding:8px;border:1px solid #e5e7eb;">${params.summary.commercial_label}</td>
            <td style="padding:8px;border:1px solid #e5e7eb;text-align:right;">- ${formatMoney(params.summary.commercial_value)}</td>
          </tr>
          <tr>
            <td style="padding:8px;border:1px solid #e5e7eb;"><strong>Total con condición comercial</strong></td>
            <td style="padding:8px;border:1px solid #e5e7eb;text-align:right;"><strong>${formatMoney(params.summary.total_with_commercial_terms)}</strong></td>
          </tr>
          <tr>
            <td style="padding:8px;border:1px solid #e5e7eb;">Envío</td>
            <td style="padding:8px;border:1px solid #e5e7eb;text-align:right;">${formatMoney(params.summary.shipping_cost)}</td>
          </tr>
          <tr>
            <td style="padding:8px;border:1px solid #e5e7eb;">Retefuente</td>
            <td style="padding:8px;border:1px solid #e5e7eb;text-align:right;">- ${formatMoney(params.summary.retefuente_value)}</td>
          </tr>
          <tr>
            <td style="padding:8px;border:1px solid #e5e7eb;">ICA</td>
            <td style="padding:8px;border:1px solid #e5e7eb;text-align:right;">- ${formatMoney(params.summary.ica_value)}</td>
          </tr>
          <tr>
            <td style="padding:8px;border:1px solid #e5e7eb;">Costo adicional por pago</td>
            <td style="padding:8px;border:1px solid #e5e7eb;text-align:right;">${formatMoney(params.summary.payment_fee)}</td>
          </tr>
          <tr>
            <td style="padding:8px;border:1px solid #e5e7eb;"><strong>Total a pagar</strong></td>
            <td style="padding:8px;border:1px solid #e5e7eb;text-align:right;"><strong>${params.totalFormatted}</strong></td>
          </tr>
        </tbody>
      </table>

      <h3 style="margin-top:24px;">Datos para pago</h3>

      <div style="margin-top:12px;padding:16px;border:1px solid #e5e7eb;border-radius:12px;background:#f8fafc;">
        <p style="margin:0 0 8px 0;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#64748b;"><strong>Opción 1</strong></p>
        <p style="margin:0 0 8px 0;"><strong>Banco:</strong> Banco ITAÚ</p>
        <p style="margin:0 0 8px 0;"><strong>Titular:</strong> Comercializadora AETOS SAS</p>
        <p style="margin:0 0 8px 0;"><strong>Tipo de cuenta:</strong> Cuenta de Ahorros</p>
        <p style="margin:0 0 8px 0;"><strong>Número de cuenta:</strong> 213 186 906</p>
        <p style="margin:0 0 8px 0;"><strong>NIT:</strong> 900.197.911-5</p>
        <p style="margin:0;"><strong>Llave Bre-B:</strong> 0090218528</p>
      </div>

      <div style="margin-top:12px;padding:16px;border:1px solid #e5e7eb;border-radius:12px;background:#f8fafc;">
        <p style="margin:0 0 8px 0;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#64748b;"><strong>Opción 2</strong></p>
        <p style="margin:0 0 8px 0;"><strong>Banco:</strong> Banco Bancolombia</p>
        <p style="margin:0 0 8px 0;"><strong>Titular:</strong> Comercializadora AETOS SAS</p>
        <p style="margin:0 0 8px 0;"><strong>Tipo de cuenta:</strong> Cuenta de Ahorros</p>
        <p style="margin:0 0 8px 0;"><strong>Número de cuenta:</strong> 688-000082-53</p>
        <p style="margin:0;"><strong>NIT:</strong> 900.197.911-5</p>
      </div>

      <div style="margin-top:16px;padding:16px;border:1px solid #fde68a;border-radius:12px;background:#fffbeb;">
        <p style="margin:0 0 8px 0;"><strong>Compromiso de pago</strong></p>
        <p style="margin:0;line-height:1.6;">
          Este pedido fue confirmado por el cliente y las unidades quedaron reservadas en Medusa mientras se valida el pago.
          El pago debe realizarse dentro de las <strong>24 horas siguientes</strong> a la confirmación del pedido.
          Si el pago no se recibe o no puede ser validado dentro de ese plazo, las unidades podrán liberarse nuevamente para la venta.
        </p>
      </div>

      <div style="margin-top:16px;padding:16px;border:1px solid #e5e7eb;border-radius:12px;background:#f8fafc;">
        <p style="margin:0 0 8px 0;"><strong>Envío del soporte</strong></p>
        <p style="margin:0 0 8px 0;"><strong>Correo:</strong> ventas@movitecgames.com</p>
        <p style="margin:0 0 8px 0;"><strong>Asunto del correo:</strong> ${params.publicOrderNumber}</p>
        <p style="margin:0;line-height:1.6;">
          Adjunta el soporte de pago y usa como asunto el número del pedido para facilitar la validación.
        </p>
      </div>

      <h3 style="margin-top:24px;">Items</h3>
      <table style="border-collapse:collapse;width:100%;">
        <thead>
          <tr>
            <th style="padding:8px;border:1px solid #e5e7eb;text-align:left;">Producto</th>
            <th style="padding:8px;border:1px solid #e5e7eb;text-align:center;">Cantidad</th>
            <th style="padding:8px;border:1px solid #e5e7eb;text-align:right;">PVP unitario</th>
            <th style="padding:8px;border:1px solid #e5e7eb;text-align:right;">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <p style="margin-top:20px;">
        Este pedido fue confirmado por el cliente y las unidades quedaron reservadas en Medusa mientras se valida el pago.
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
        public_order_number: snapshot.public_order_number,
        customer_email: snapshot.customer_email,
        customer_name: snapshot.customer_name,
        company: snapshot.company,
        phone: snapshot.phone,
        payment_method: snapshot.payment_method,
        commercial_payment_status: snapshot.commercial_payment_status,
        delivery_mode: snapshot.delivery_mode,
        shipping_address: snapshot.shipping_address,
        currency_code: snapshot.currency_code,
        total_pvp: snapshot.total_pvp,
        commercial_label: snapshot.commercial_label,
        commercial_value: snapshot.commercial_value,
        total_with_commercial_terms: snapshot.total_with_commercial_terms,
        shipping_cost: snapshot.shipping_cost,
        retefuente_value: snapshot.retefuente_value,
        ica_value: snapshot.ica_value,
        payment_fee: snapshot.payment_fee,
        final_total: snapshot.final_total,
        items_json: snapshot.items_json,
        raw_json: snapshot.raw_json,
      },
      { onConflict: "order_id" }
    )

  if (error) {
    throw new Error(
      `No fue posible guardar el snapshot del pedido. ${error.message}`
    )
  }
}

export async function POST(req: Request) {
  const maintenanceMode =
    String(process.env.CHECKOUT_MAINTENANCE_MODE || "")
      .trim()
      .toLowerCase() === "true"

  if (maintenanceMode) {
    return NextResponse.json(
      {
        ok: false,
        maintenance: true,
        error: "La confirmación de nuevos pedidos está temporalmente suspendida mientras verificamos el inventario.",
      },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    )
  }

  try {
    const body = await req.json().catch(() => null)
    const cartId = String(body?.cartId || "").trim()

    if (!cartId) {
      return NextResponse.json(
        { ok: false, error: "No se recibió cartId." },
        { status: 400 }
      )
    }

    const { cart } = await medusa.store.cart.retrieve(cartId, {
      fields:
        "*items,+items.metadata,+items.variant,+items.variant.metadata,+metadata,+shipping_address,+billing_address,+shipping_methods",
    } as any)

    const metadata = (cart as any)?.metadata || {}
    const paymentMethod = String(metadata.payment_method || "breb")

    if (paymentMethod !== "breb") {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Esta ruta solo confirma pedidos con Bre-B o transferencia bancaria.",
        },
        { status: 400 }
      )
    }

    const deliveryMode = String(metadata.delivery_mode || "pickup")

    const totalPvp = getNumber(
      metadata.checkout_total_pvp ?? metadata.cart_total_pvp ?? 0
    )
    const commercialLabel = String(
      metadata.checkout_commercial_label ??
        metadata.cart_commercial_label ??
        "Condición comercial"
    )
    const commercialValue = getNumber(
      metadata.checkout_commercial_value ?? metadata.cart_commercial_value ?? 0
    )
    const totalWithCommercialTerms = getNumber(
      metadata.checkout_total_with_commercial_terms ??
        metadata.cart_total_with_commercial_terms ??
        0
    )
    const shippingCost = getNumber(
      metadata.checkout_shipping_cost ?? metadata.selected_shipping_price ?? 0
    )
    const paymentFee = getNumber(
      metadata.checkout_payment_fee ?? metadata.payment_fee_value ?? 0
    )
    const retefuenteValue = getNumber(
      metadata.checkout_retefuente_value ?? metadata.retefuente_value ?? 0
    )
    const icaValue = getNumber(
      metadata.checkout_ica_value ?? metadata.ica_value ?? 0
    )
    const finalTotal = getNumber(
      metadata.checkout_final_total ??
        metadata.cart_final_payable_total ??
        (totalWithCommercialTerms +
          shippingCost -
          retefuenteValue -
          icaValue +
          paymentFee)
    )

    const optionsResponse = await medusa.store.fulfillment.listCartOptions({
      cart_id: cartId,
    } as any)

    const options = Array.isArray((optionsResponse as any)?.shipping_options)
      ? (optionsResponse as any).shipping_options
      : Array.isArray(optionsResponse)
      ? optionsResponse
      : []

    const targetOption = options.find((option: any) => {
      const optionName = normalizeText(option?.name)
      const typeLabel = normalizeText(option?.shipping_option_type?.label)
      const typeCode = normalizeText(option?.shipping_option_type?.code)

      if (deliveryMode === "pickup") {
        return (
          optionName.includes("recoger") ||
          optionName.includes("recogida") ||
          optionName.includes("bodega") ||
          typeLabel.includes("recogida") ||
          typeCode.includes("recogida")
        )
      }

      if (deliveryMode === "bogota") {
        return (
          optionName.includes("bogota") ||
          typeLabel.includes("bogota") ||
          typeCode.includes("bogota")
        )
      }

      if (deliveryMode === "nacional") {
        return (
          optionName.includes("nacional") ||
          typeLabel.includes("nacional") ||
          typeCode.includes("nacional")
        )
      }

      return false
    })

    if (!targetOption?.id) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "No se encontró una shipping option válida para la modalidad de entrega seleccionada.",
          available_options: options.map((option: any) => ({
            id: option?.id,
            name: option?.name,
            type_label: option?.shipping_option_type?.label,
            type_code: option?.shipping_option_type?.code,
          })),
        },
        { status: 400 }
      )
    }

    const currentShippingMethods = Array.isArray((cart as any)?.shipping_methods)
      ? (cart as any).shipping_methods
      : []

    const alreadyAssigned = currentShippingMethods.some(
      (method: any) => method?.shipping_option_id === targetOption.id
    )

    if (!alreadyAssigned) {
      await medusa.store.cart.addShippingMethod(cartId, {
        option_id: targetOption.id,
      } as any)
    }

    await medusa.store.payment.initiatePaymentSession(cart as any, {
      provider_id: "pp_system_default",
    })

    const completion = await medusa.store.cart.complete(cartId)

    if (completion.type === "cart" || !completion.order) {
      return NextResponse.json(
        {
          ok: false,
          error:
            completion.error?.message ||
            "No fue posible completar el carrito y crear la orden.",
          details: completion.error || null,
        },
        { status: 400 }
      )
    }

    const order = completion.order as any
    const publicOrderNumber = `MV-${order.display_id}`

    const customerName = [
      cart?.shipping_address?.first_name || "",
      cart?.shipping_address?.last_name || "",
    ]
      .filter(Boolean)
      .join(" ")

    const shippingAddress =
      deliveryMode === "pickup"
        ? String(metadata.pickup_instructions || "Recoger en bodega")
        : [
            cart?.shipping_address?.address_1 || "",
            cart?.shipping_address?.city || "",
            cart?.shipping_address?.province || "",
            cart?.shipping_address?.postal_code || "",
          ]
            .filter(Boolean)
            .join(", ")

    const orderPayload = {
      id: order.id,
      display_id: order.display_id,
      public_order_number: publicOrderNumber,
      email: String(cart?.email || ""),
      total: finalTotal,
      currency_code: String(cart?.currency_code?.toUpperCase() || "COP"),
      summary: {
        total_pvp: totalPvp,
        commercial_label: commercialLabel,
        commercial_value: commercialValue,
        total_with_commercial_terms: totalWithCommercialTerms,
        shipping_cost: shippingCost,
        retefuente_value: retefuenteValue,
        ica_value: icaValue,
        payment_fee: paymentFee,
      },
      customer: {
        name: customerName,
        company: String(cart?.shipping_address?.company || ""),
        phone: String(cart?.shipping_address?.phone || ""),
        email: String(cart?.email || ""),
      },
      delivery: {
        mode: deliveryMode,
        instructions: String(metadata.pickup_instructions || ""),
        address: String(cart?.shipping_address?.address_1 || ""),
        city: String(cart?.shipping_address?.city || ""),
        province: String(cart?.shipping_address?.province || ""),
        postal_code: String(cart?.shipping_address?.postal_code || ""),
        shipping_label: String(metadata.selected_shipping_label || ""),
      },
      items: (cart?.items || []).map((item: any) => ({
        title: String(item?.title || "Producto"),
        quantity: Number(item?.quantity || 0),
        unit_price: Number(item?.unit_price || 0),
        subtotal: Number(item?.unit_price || 0) * Number(item?.quantity || 0),
      })),
    }

    try {
      await saveOrderSnapshot({
        order_id: orderPayload.id,
        public_order_number: orderPayload.public_order_number,
        customer_email: orderPayload.customer.email || "",
        customer_name: orderPayload.customer.name || "",
        company: orderPayload.customer.company || "",
        phone: orderPayload.customer.phone || "",
        payment_method: paymentMethod,
        commercial_payment_status: "pending",
        delivery_mode: deliveryMode,
        shipping_address: shippingAddress,
        currency_code: orderPayload.currency_code,
        total_pvp: totalPvp,
        commercial_label: commercialLabel,
        commercial_value: commercialValue,
        total_with_commercial_terms: totalWithCommercialTerms,
        shipping_cost: shippingCost,
        retefuente_value: retefuenteValue,
        ica_value: icaValue,
        payment_fee: paymentFee,
        final_total: finalTotal,
        items_json: orderPayload.items,
        raw_json: orderPayload,
      })
    } catch (snapshotError) {
      console.error("[B2B_ORDER_SNAPSHOT] unexpected error", snapshotError)
    }

    let salesEmailSent = false
    let customerEmailSent = false

    try {
      const summaryForEmail = {
        total_pvp: totalPvp,
        commercial_label: commercialLabel,
        commercial_value: commercialValue,
        total_with_commercial_terms: totalWithCommercialTerms,
        shipping_cost: shippingCost,
        retefuente_value: retefuenteValue,
        ica_value: icaValue,
        payment_fee: paymentFee,
      }

      const itemsForEmail = orderPayload.items

      const salesHtml = buildOrderEmailHtml({
        title: "Nuevo pedido B2B confirmado",
        publicOrderNumber,
        customerEmail: orderPayload.customer.email || "",
        customerName: orderPayload.customer.name || "",
        company: orderPayload.customer.company || "",
        phone: orderPayload.customer.phone || "",
        totalFormatted: formatMoney(finalTotal, orderPayload.currency_code),
        deliveryMode:
          deliveryMode === "pickup"
            ? "Recoger en bodega"
            : deliveryMode === "bogota"
            ? "Entrega en Bogotá"
            : "Envío nacional",
        shippingAddress,
        summary: summaryForEmail,
        items: itemsForEmail,
      })

      const customerHtml = buildOrderEmailHtml({
        title: "Tu pedido B2B fue confirmado",
        publicOrderNumber,
        customerEmail: orderPayload.customer.email || "",
        customerName: orderPayload.customer.name || "",
        company: orderPayload.customer.company || "",
        phone: orderPayload.customer.phone || "",
        totalFormatted: formatMoney(finalTotal, orderPayload.currency_code),
        deliveryMode:
          deliveryMode === "pickup"
            ? "Recoger en bodega"
            : deliveryMode === "bogota"
            ? "Entrega en Bogotá"
            : "Envío nacional",
        shippingAddress,
        summary: summaryForEmail,
        items: itemsForEmail,
      })

      const salesRecipient =
        process.env.ORDER_NOTIFICATION_TO || "ventas@movitecgames.com"

      await sendEmail({
        to: [salesRecipient],
        subject: `Nuevo pedido B2B confirmado - ${publicOrderNumber}`,
        html: salesHtml,
      })

      salesEmailSent = true

      if (orderPayload.customer.email) {
        await sendEmail({
          to: [orderPayload.customer.email],
          subject: `Confirmación de pedido - ${publicOrderNumber}`,
          html: customerHtml,
        })

        customerEmailSent = true
      }
    } catch (emailError) {
      console.error("[B2B_CONFIRM_ORDER_EMAIL] unexpected error", emailError)
    }

    return NextResponse.json({
      ok: true,
      salesEmailSent,
      customerEmailSent,
      order: orderPayload,
    })
  } catch (error) {
    console.error("[B2B_CONFIRM_BANK_ORDER] unexpected error", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Ocurrió un error confirmando el pedido.",
      },
      { status: 500 }
    )
  }
}

