import { NextResponse } from "next/server"
import Medusa from "@medusajs/js-sdk"

const medusa = new Medusa({
  baseUrl: process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL!,
  publishableKey: process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY!,
  debug: process.env.NODE_ENV === "development",
  auth: {
    type: "jwt",
  },
})

function normalizeWhitespace(value: unknown) {
  return String(value || "").replace(/\s+/g, " ").trim()
}

function getNumber(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function generateCheckoutOrderNumber(existing?: string) {
  const normalizedExisting = normalizeWhitespace(existing || "")
  if (normalizedExisting) return normalizedExisting

  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  const hours = String(now.getHours()).padStart(2, "0")
  const minutes = String(now.getMinutes()).padStart(2, "0")
  const seconds = String(now.getSeconds()).padStart(2, "0")
  const random = Math.floor(100 + Math.random() * 900)

  return `MV-${year}${month}${day}-${hours}${minutes}${seconds}-${random}`
}

async function sha256Hex(value: string) {
  const encoder = new TextEncoder()
  const data = encoder.encode(value)
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
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

    const wompiPublicKey = normalizeWhitespace(process.env.WOMPI_PUBLIC_KEY)
    const wompiIntegritySecret = normalizeWhitespace(
      process.env.WOMPI_INTEGRITY_SECRET
    )
    const storefrontUrl = normalizeWhitespace(
      process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL
    )

    if (!wompiPublicKey) {
      return NextResponse.json(
        { ok: false, error: "Falta WOMPI_PUBLIC_KEY." },
        { status: 500 }
      )
    }

    if (!wompiIntegritySecret) {
      return NextResponse.json(
        { ok: false, error: "Falta WOMPI_INTEGRITY_SECRET." },
        { status: 500 }
      )
    }

    if (!storefrontUrl) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Falta NEXT_PUBLIC_SITE_URL o NEXT_PUBLIC_BASE_URL para construir la URL de retorno.",
        },
        { status: 500 }
      )
    }

    const { cart } = await medusa.store.cart.retrieve(cartId, {
      fields:
        "*items,+items.metadata,+items.variant,+items.variant.metadata,+metadata,+shipping_address,+billing_address,+shipping_methods",
    } as any)

    const metadata = (cart as any)?.metadata || {}
    const paymentMethod = normalizeWhitespace(metadata.payment_method || "breb")

    if (paymentMethod !== "wompi") {
      return NextResponse.json(
        {
          ok: false,
          error: "Esta ruta solo aplica cuando el método de pago es Wompi.",
        },
        { status: 400 }
      )
    }

    const currency = String(cart?.currency_code || "COP").toUpperCase()
    const finalTotal = getNumber(
      metadata.checkout_final_total ??
        metadata.cart_final_payable_total ??
        metadata.total_to_pay ??
        cart?.total ??
        0
    )

    if (finalTotal <= 0) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "El total final del checkout no es válido para crear la transacción.",
        },
        { status: 400 }
      )
    }

    const amountInCents = Math.round(finalTotal * 100)
    const reference = generateCheckoutOrderNumber(
      String(metadata.checkout_order_number || "")
    )
    const customerEmail = normalizeWhitespace(
      cart?.email || cart?.shipping_address?.email || ""
    )

    const redirectUrl = `${storefrontUrl.replace(/\/+$/, "")}/checkout/wompi/resultado?reference=${encodeURIComponent(
      reference
    )}`

    const integritySource = `${reference}${amountInCents}${currency}${wompiIntegritySecret}`
    const signature = await sha256Hex(integritySource)

    return NextResponse.json({
      ok: true,
      checkout: {
        public_key: wompiPublicKey,
        currency,
        amount_in_cents: amountInCents,
        reference,
        redirect_url: redirectUrl,
        signature,
        customer_email: customerEmail,
      },
    })
  } catch (error) {
    console.error("[WOMPI_CREATE_CHECKOUT] unexpected error", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Ocurrió un error creando el checkout de Wompi.",
      },
      { status: 500 }
    )
  }
}