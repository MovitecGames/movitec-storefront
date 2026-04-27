import { NextResponse } from "next/server"
import Medusa from "@medusajs/js-sdk"
import { createHash } from "crypto"

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
  const suffix = normalizeWhitespace(cartId).replace(/[^a-zA-Z0-9]/g, "").slice(-6).toUpperCase()

  return `MV-WOMPI-${year}${month}${day}${hours}${minutes}${seconds}-${suffix || "CART"}`
}

function getAmountInCents(value: number) {
  return Math.round(value * 100)
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

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null)
    const cartId = normalizeWhitespace(body?.cartId)

    if (!cartId) {
      return NextResponse.json(
        { ok: false, error: "No se recibió cartId." },
        { status: 400 }
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
        { status: 500 }
      )
    }

    const { cart } = await medusa.store.cart.retrieve(cartId, {
      fields:
        "*items,+items.metadata,+items.variant,+items.variant.metadata,+metadata,+shipping_address,+billing_address,+shipping_methods",
    } as any)

    const metadata = (cart as any)?.metadata || {}
    const paymentMethod = String(metadata.payment_method || "").trim().toLowerCase()

    if (paymentMethod !== "wompi") {
      return NextResponse.json(
        {
          ok: false,
          error: "Esta ruta solo prepara pagos cuando el método seleccionado es Wompi.",
        },
        { status: 400 }
      )
    }

    const currency = String(cart?.currency_code || "COP").toUpperCase()

    if (currency !== "COP") {
      return NextResponse.json(
        {
          ok: false,
          error: "La integración actual de Wompi quedó preparada para COP.",
        },
        { status: 400 }
      )
    }

    const totalWithCommercialTerms = getNumber(
      metadata.checkout_total_with_commercial_terms ??
        metadata.cart_total_with_commercial_terms ??
        0
    )

    const shippingCost = getNumber(
      metadata.checkout_shipping_cost ?? metadata.selected_shipping_price ?? 0
    )

    const retefuenteValue = getNumber(
      metadata.checkout_retefuente_value ?? metadata.retefuente_value ?? 0
    )

    const icaValue = getNumber(
      metadata.checkout_ica_value ?? metadata.ica_value ?? 0
    )

    const paymentFee = getNumber(
      metadata.checkout_payment_fee ?? metadata.payment_fee_value ?? 0
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
          error: "El total final del checkout no es válido para iniciar el pago.",
        },
        { status: 400 }
      )
    }

    const amountInCents = getAmountInCents(finalTotal)
    const reference = buildWompiReference(metadata.checkout_order_number, cartId)
    const redirectUrl = `${baseUrl.replace(/\/$/, "")}/checkout/wompi/resultado`
    const integritySignature = buildIntegritySignature({
      reference,
      amountInCents,
      currency,
      integritySecret: wompiIntegritySecret,
    })

    const shippingAddress = cart?.shipping_address || {}

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
          email: normalizeWhitespace(cart?.email),
          full_name: normalizeWhitespace(
            `${shippingAddress.first_name || ""} ${shippingAddress.last_name || ""}`
          ),
          phone_number: normalizeWhitespace(shippingAddress.phone),
        },
        shipping_address: {
          address_line_1: normalizeWhitespace(shippingAddress.address_1),
          country: String(shippingAddress.country_code || "CO").toUpperCase(),
          city: normalizeWhitespace(shippingAddress.city),
          region: normalizeWhitespace(shippingAddress.province),
          phone_number: normalizeWhitespace(shippingAddress.phone),
          name: normalizeWhitespace(
            `${shippingAddress.first_name || ""} ${shippingAddress.last_name || ""}`
          ),
          postal_code: normalizeWhitespace(shippingAddress.postal_code),
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
    console.error("[B2B_START_WOMPI_PAYMENT] unexpected error", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Ocurrió un error iniciando el pago con Wompi.",
      },
      { status: 500 }
    )
  }
}