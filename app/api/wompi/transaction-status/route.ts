import { NextResponse } from "next/server"

function normalizeWhitespace(value: unknown) {
  return String(value || "").replace(/\s+/g, " ").trim()
}

function getWompiBaseUrl() {
  const publicKey = process.env.WOMPI_PUBLIC_KEY || ""

  if (publicKey.startsWith("pub_test_")) {
    return "https://sandbox.wompi.co/v1"
  }

  return "https://production.wompi.co/v1"
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const transactionId = normalizeWhitespace(searchParams.get("id"))
    const wompiPublicKey = normalizeWhitespace(process.env.WOMPI_PUBLIC_KEY)

    if (!transactionId) {
      return NextResponse.json(
        { ok: false, error: "No se recibió el id de la transacción." },
        { status: 400 }
      )
    }

    if (!wompiPublicKey) {
      return NextResponse.json(
        { ok: false, error: "Falta WOMPI_PUBLIC_KEY en variables de entorno." },
        { status: 500 }
      )
    }

    const wompiBaseUrl = getWompiBaseUrl()

    const response = await fetch(
      `${wompiBaseUrl}/transactions/${encodeURIComponent(transactionId)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${wompiPublicKey}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    )

    const data = await response.json().catch(() => null)

    if (!response.ok || !data?.data) {
      return NextResponse.json(
        {
          ok: false,
          error:
            data?.error?.reason ||
            data?.error?.messages ||
            "No fue posible consultar la transacción en Wompi.",
          raw: data,
        },
        { status: response.status || 500 }
      )
    }

    const transaction = data.data

    return NextResponse.json({
      ok: true,
      transaction: {
        id: transaction.id,
        reference: transaction.reference,
        status: transaction.status,
        status_message: transaction.status_message,
        amount_in_cents: transaction.amount_in_cents,
        currency: transaction.currency,
        payment_method_type: transaction.payment_method_type,
        redirect_url: transaction.redirect_url,
        finalized_at: transaction.finalized_at,
        created_at: transaction.created_at,
        customer_email: transaction.customer_email,
        raw: transaction,
      },
    })
  } catch (error) {
    console.error("[WOMPI_TRANSACTION_STATUS] unexpected error", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Ocurrió un error consultando la transacción en Wompi.",
      },
      { status: 500 }
    )
  }
}