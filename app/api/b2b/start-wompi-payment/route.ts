import { NextResponse } from "next/server"
import Medusa from "@medusajs/js-sdk"
import { createHash } from "crypto"
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

function normalizeWhitespace(value: unknown) {
  return String(value || "").replace(/\s+/g, " ").trim()
}

function buildWompiReference(existing?: string, cartId?: string) {
  const normalizedExisting = normalizeWhitespace(existing)

  if (normalizedExisting) return normalizedExisting

  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  const hours = String(now.getHours()).padStart(2, "0")
  const minutes = String(now.getMinutes()).padStart(2, "0")
  const seconds = String(now.getSeconds()).padStart(2, "0")

  const suffix = normalizeWhitespace(cartId)
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(-6)
    .toUpperCase()

  return `MV-WOMPI-${year}${month}${day}${hours}${minutes}${seconds}-${
    suffix || "CART"
  }`
}

function getAmountInCents(value: number) {
  const roundedAmountInPesos = Math.round(value)

  return roundedAmountInPesos * 100
}

function buildIntegritySignature(params: {
  reference: string
  amountInCents: number
  currency: string
  integritySecret: string
}) {
  const raw = `${params.reference}${params.amountInCents}${params.currency}${params.integritySecret}`

  return createHash("sha256").update(raw).digest("hex")
}

async function savePaymentIntent(params: {
  reference: string
  cartId: string
  amountInCents: number
  currency: string
  customerEmail: string
  rawJson: Record<string, any>
}) {
  const { data: existingIntent, error: lookupError } = await supabaseAdmin
    .from("b2b_wompi_payment_intents")
    .select("*")
    .eq("reference", params.reference)
    .maybeSingle()

  if (lookupError) {
    throw new Error(
      `No fue posible consultar el intento de pago Wompi. ${lookupError.message}`
    )
  }

  if (existingIntent) {
    const existingCartId = normalizeWhitespace(existingIntent.cart_id)
    const existingCurrency = String(existingIntent.currency || "").toUpperCase()
    const existingAmountInCents = Number(existingIntent.amount_in_cents || 0)

    if (existingCartId && existingCartId !== params.cartId) {
      throw new Error(
        "La referencia Wompi ya está asociada a otro carrito. No se puede continuar con el pago."
      )
    }

    if (
      existingAmountInCents > 0 &&
      existingAmountInCents !== params.amountInCents
    ) {
      throw new Error(
        "La referencia Wompi ya existe con un valor diferente. Actualiza el checkout e intenta nuevamente."
      )
    }

    if (
      existingCurrency &&
      existingCurrency !== params.currency.toUpperCase()
    ) {
      throw new Error(
        "La referencia Wompi ya existe con una moneda diferente."
      )
    }

    if (
      existingIntent.order_id ||
      String(existingIntent.status || "").toLowerCase() === "processed"
    ) {
      throw new Error(
        "Esta referencia Wompi ya fue procesada y tiene una orden asociada."
      )
    }

    const previousRawJson =
      existingIntent.raw_json &&
      typeof existingIntent.raw_json === "object" &&
      !Array.isArray(existingIntent.raw_json)
        ? existingIntent.raw_json
        : {}

    const { error: updateError } = await supabaseAdmin
      .from("b2b_wompi_payment_intents")
      .update({
        cart_id: params.cartId,
        amount_in_cents: params.amountInCents,
        currency: params.currency.toUpperCase(),
        status: "pending",
        commercial_payment_status: "pending",
        customer_email: params.customerEmail,
        last_error: null,
        raw_json: {
          ...previousRawJson,
          ...params.rawJson,
          payment_intent_last_prepared_at: new Date().toISOString(),
        },
      })
      .eq("id", existingIntent.id)

    if (updateError) {
      throw new Error(
        `No fue posible actualizar el intento de pago Wompi. ${updateError.message}`
      )
    }

    return
  }

  const { error: insertError } = await supabaseAdmin
    .from("b2b_wompi_payment_intents")
    .insert({
      reference: params.reference,
      cart_id: params.cartId,
      amount_in_cents: params.amountInCents,
      currency: params.currency.toUpperCase(),
      status: "pending",
      commercial_payment_status: "pending",
      customer_email: params.customerEmail,
      raw_json: {
        ...params.rawJson,
        payment_intent_created_at: new Date().toISOString(),
      },
    })

  if (insertError) {
    throw new Error(
      `No fue posible guardar el intento de pago Wompi. ${insertError.message}`
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
        error: "El inicio de nuevos pagos está temporalmente suspendido mientras verificamos el inventario.",
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
    const cartId = normalizeWhitespace(body?.cartId)

    if (!cartId) {
      return NextResponse.json(
        {
          ok: false,
          error: "No se recibió cartId.",
        },
        {
          status: 400,
        }
      )
    }

    const wompiPublicKey = process.env.WOMPI_PUBLIC_KEY || ""
    const wompiIntegritySecret = process.env.WOMPI_INTEGRITY_SECRET || ""
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ""

    if (!wompiPublicKey || !wompiIntegritySecret || !baseUrl) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Faltan WOMPI_PUBLIC_KEY, WOMPI_INTEGRITY_SECRET o NEXT_PUBLIC_BASE_URL en variables de entorno.",
        },
        {
          status: 500,
        }
      )
    }

    const { cart } = await medusa.store.cart.retrieve(cartId, {
      fields:
        "*items,+items.metadata,+items.variant,+items.variant.metadata,+metadata,+shipping_address,+billing_address,+shipping_methods",
    } as any)

    const metadata = (cart as any)?.metadata || {}

    const paymentMethod = String(metadata.payment_method || "")
      .trim()
      .toLowerCase()

    if (paymentMethod !== "wompi") {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Esta ruta solo prepara pagos cuando el método seleccionado es Wompi.",
        },
        {
          status: 400,
        }
      )
    }

    const currency = String(cart?.currency_code || "COP").toUpperCase()

    if (currency !== "COP") {
      return NextResponse.json(
        {
          ok: false,
          error: "La integración actual de Wompi quedó preparada para COP.",
        },
        {
          status: 400,
        }
      )
    }

    const totalWithCommercialTerms = getNumber(
      metadata.checkout_total_with_commercial_terms ??
        metadata.cart_total_with_commercial_terms ??
        0
    )

    const shippingCost = getNumber(
      metadata.checkout_shipping_cost ??
        metadata.selected_shipping_price ??
        0
    )

    const retefuenteValue = getNumber(
      metadata.checkout_retefuente_value ??
        metadata.retefuente_value ??
        0
    )

    const icaValue = getNumber(
      metadata.checkout_ica_value ?? metadata.ica_value ?? 0
    )

    const paymentFee = getNumber(
      metadata.checkout_payment_fee ??
        metadata.payment_fee_value ??
        0
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

    if (!(finalTotal > 0)) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "El total final del checkout no es válido para iniciar el pago.",
        },
        {
          status: 400,
        }
      )
    }

    const amountInCents = getAmountInCents(finalTotal)

    const reference = buildWompiReference(
      metadata.checkout_order_number,
      cartId
    )

    const customerEmail = normalizeWhitespace(cart?.email)

    const redirectUrl = `${baseUrl.replace(
      /\/$/,
      ""
    )}/checkout/wompi/resultado?reference=${encodeURIComponent(
      reference
    )}&cart_id=${encodeURIComponent(cartId)}`

    const integritySignature = buildIntegritySignature({
      reference,
      amountInCents,
      currency,
      integritySecret: wompiIntegritySecret,
    })

    const shippingAddress = cart?.shipping_address || {}

    await savePaymentIntent({
      reference,
      cartId,
      amountInCents,
      currency,
      customerEmail,
      rawJson: {
        source: "b2b_start_wompi_payment",
        payment_method: paymentMethod,
        checkout_order_number: normalizeWhitespace(
          metadata.checkout_order_number
        ),
        commercial_summary: {
          total_with_commercial_terms: totalWithCommercialTerms,
          shipping_cost: shippingCost,
          retefuente_value: retefuenteValue,
          ica_value: icaValue,
          payment_fee: paymentFee,
          final_total: finalTotal,
        },
        delivery: {
          mode: normalizeWhitespace(metadata.delivery_mode),
          selected_shipping_label: normalizeWhitespace(
            metadata.selected_shipping_label
          ),
          selected_shipping_price: shippingCost,
        },
      },
    })

    return NextResponse.json({
      ok: true,
      wompi: {
        public_key: wompiPublicKey,
        currency,
        amount_in_cents: amountInCents,
        reference,
        signature: {
          integrity: integritySignature,
        },
        redirect_url: redirectUrl,
        customer_data: {
          email: customerEmail,
          full_name: normalizeWhitespace(
            `${shippingAddress.first_name || ""} ${
              shippingAddress.last_name || ""
            }`
          ),
          phone_number: normalizeWhitespace(shippingAddress.phone),
        },
        shipping_address: {
          address_line_1: normalizeWhitespace(shippingAddress.address_1),
          country: String(
            shippingAddress.country_code || "CO"
          ).toUpperCase(),
          city: normalizeWhitespace(shippingAddress.city),
          region: normalizeWhitespace(shippingAddress.province),
          phone_number: normalizeWhitespace(shippingAddress.phone),
          name: normalizeWhitespace(
            `${shippingAddress.first_name || ""} ${
              shippingAddress.last_name || ""
            }`
          ),
          postal_code: normalizeWhitespace(
            shippingAddress.postal_code
          ),
        },
      },
      commercial_summary: {
        total_with_commercial_terms: totalWithCommercialTerms,
        shipping_cost: shippingCost,
        retefuente_value: retefuenteValue,
        ica_value: icaValue,
        payment_fee: paymentFee,
        final_total: finalTotal,
      },
    })
  } catch (error) {
    console.error(
      "[B2B_START_WOMPI_PAYMENT] unexpected error",
      error
    )

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Ocurrió un error iniciando el pago con Wompi.",
      },
      {
        status: 500,
      }
    )
  }
}