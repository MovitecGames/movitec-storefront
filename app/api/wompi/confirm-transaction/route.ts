import { NextResponse } from "next/server"
import { supabaseAdmin } from "../../../../lib/supabase-admin"

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

function mapWompiStatusToCommercialStatus(status?: string) {
  const normalized = String(status || "").trim().toUpperCase()

  if (normalized === "APPROVED") return "paid"
  if (normalized === "PENDING") return "under_review"
  if (normalized === "DECLINED") return "rejected"
  if (normalized === "VOIDED") return "expired"
  if (normalized === "ERROR") return "rejected"

  return "pending"
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null)

    const transactionId = normalizeWhitespace(body?.transactionId)
    const referenceFromBody = normalizeWhitespace(body?.reference)

    if (!transactionId) {
      return NextResponse.json(
        { ok: false, error: "No se recibió transactionId." },
        { status: 400 }
      )
    }

    const wompiBaseUrl = getWompiBaseUrl()

    const wompiResponse = await fetch(
      `${wompiBaseUrl}/transactions/${encodeURIComponent(transactionId)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    )

    const wompiData = await wompiResponse.json().catch(() => null)

    if (!wompiResponse.ok || !wompiData?.data) {
      return NextResponse.json(
        {
          ok: false,
          error:
            wompiData?.error?.reason ||
            wompiData?.error?.messages ||
            "No fue posible consultar la transacción en Wompi.",
          raw: wompiData,
        },
        { status: wompiResponse.status || 500 }
      )
    }

    const transaction = wompiData.data
    const reference = normalizeWhitespace(transaction.reference || referenceFromBody)

    if (!reference) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "La transacción no trae referencia y no fue posible identificar el pedido.",
          transaction: {
            id: transaction.id,
            status: transaction.status,
          },
        },
        { status: 400 }
      )
    }

    const commercialStatus = mapWompiStatusToCommercialStatus(transaction.status)

    const { data: existingSnapshot, error: snapshotLookupError } = await supabaseAdmin
      .from("b2b_order_snapshots")
      .select("*")
      .eq("public_order_number", reference)
      .maybeSingle()

    if (snapshotLookupError) {
      return NextResponse.json(
        {
          ok: false,
          error: `No fue posible buscar el pedido en Supabase. ${snapshotLookupError.message}`,
        },
        { status: 500 }
      )
    }

    if (!existingSnapshot) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "No se encontró un pedido en Supabase asociado a la referencia recibida.",
          reference,
          transaction: {
            id: transaction.id,
            status: transaction.status,
          },
        },
        { status: 404 }
      )
    }

    const previousRaw =
      existingSnapshot.raw_json &&
      typeof existingSnapshot.raw_json === "object" &&
      !Array.isArray(existingSnapshot.raw_json)
        ? existingSnapshot.raw_json
        : {}

    const nextRawJson = {
      ...previousRaw,
      wompi_transaction: {
        id: transaction.id,
        reference: transaction.reference,
        status: transaction.status,
        status_message: transaction.status_message,
        amount_in_cents: transaction.amount_in_cents,
        currency: transaction.currency,
        payment_method_type: transaction.payment_method_type,
        finalized_at: transaction.finalized_at,
        created_at: transaction.created_at,
        customer_email: transaction.customer_email,
        raw: transaction,
      },
      wompi_last_confirmation_at: new Date().toISOString(),
    }

    const updatePayload: Record<string, any> = {
      commercial_payment_status: commercialStatus,
      raw_json: nextRawJson,
    }

    const { data: updatedSnapshot, error: updateError } = await supabaseAdmin
      .from("b2b_order_snapshots")
      .update(updatePayload)
      .eq("order_id", existingSnapshot.order_id)
      .select("*")
      .single()

    if (updateError) {
      return NextResponse.json(
        {
          ok: false,
          error: `No fue posible actualizar el estado comercial del pedido. ${updateError.message}`,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      reference,
      commercial_payment_status: commercialStatus,
      transaction: {
        id: transaction.id,
        reference: transaction.reference,
        status: transaction.status,
        status_message: transaction.status_message,
        amount_in_cents: transaction.amount_in_cents,
        currency: transaction.currency,
        payment_method_type: transaction.payment_method_type,
        finalized_at: transaction.finalized_at,
        created_at: transaction.created_at,
        customer_email: transaction.customer_email,
      },
      snapshot: updatedSnapshot,
    })
  } catch (error) {
    console.error("[WOMPI_CONFIRM_TRANSACTION] unexpected error", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Ocurrió un error confirmando la transacción de Wompi.",
      },
      { status: 500 }
    )
  }
}