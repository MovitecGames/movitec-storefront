import { NextResponse } from "next/server"
import { supabaseAdmin } from "../../../../../lib/supabase-admin"

const ALLOWED_STATUSES = [
  "pending",
  "under_review",
  "paid",
  "rejected",
  "expired",
] as const

type AllowedStatus = (typeof ALLOWED_STATUSES)[number]

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null)

    const orderId = String(body?.order_id || "").trim()
    const nextStatus = String(body?.commercial_payment_status || "")
      .trim()
      .toLowerCase() as AllowedStatus

    if (!orderId) {
      return NextResponse.json(
        {
          ok: false,
          error: "Debes enviar order_id.",
        },
        { status: 400 }
      )
    }

    if (!ALLOWED_STATUSES.includes(nextStatus)) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "El estado enviado no es válido. Usa: pending, under_review, paid, rejected o expired.",
        },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from("b2b_order_snapshots")
      .update({
        commercial_payment_status: nextStatus,
      })
      .eq("order_id", orderId)
      .select("order_id, public_order_number, commercial_payment_status")
      .single()

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          error: `No fue posible actualizar el estado del pago. ${error.message}`,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      snapshot: data,
    })
  } catch (error) {
    console.error("[B2B_ORDER_SNAPSHOT_UPDATE_STATUS] unexpected error", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Ocurrió un error actualizando el estado del pago.",
      },
      { status: 500 }
    )
  }
}
