import { NextResponse } from "next/server"
import { supabaseAdmin } from "../../../../../lib/supabase-admin"

const ALLOWED_DELIVERY_STATUSES = [
  "pending_preparation",
  "ready_for_pickup",
  "picked_up",
  "shipped",
  "delivered",
  "cancelled",
] as const

function normalizeNullableString(value: unknown) {
  const parsed = String(value ?? "").trim()
  return parsed ? parsed : null
}

function normalizeNullableDate(value: unknown) {
  const parsed = String(value ?? "").trim()
  if (!parsed) return null

  const date = new Date(parsed)
  if (Number.isNaN(date.getTime())) return null

  return date.toISOString()
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null)

    const orderId = String(body?.order_id || "").trim()
    const deliveryStatus = String(body?.delivery_status || "")
      .trim()
      .toLowerCase()

    if (!orderId) {
      return NextResponse.json(
        { ok: false, error: "Debes enviar order_id." },
        { status: 400 }
      )
    }

    if (
      deliveryStatus &&
      !ALLOWED_DELIVERY_STATUSES.includes(
        deliveryStatus as (typeof ALLOWED_DELIVERY_STATUSES)[number]
      )
    ) {
      return NextResponse.json(
        { ok: false, error: "El delivery_status no es válido." },
        { status: 400 }
      )
    }

    const payload = {
      delivery_status: deliveryStatus || "pending_preparation",
      carrier_name: normalizeNullableString(body?.carrier_name),
      tracking_number: normalizeNullableString(body?.tracking_number),
      shipped_at: normalizeNullableDate(body?.shipped_at),
      delivered_at: normalizeNullableDate(body?.delivered_at),
      delivered_to: normalizeNullableString(body?.delivered_to),
      delivery_notes: normalizeNullableString(body?.delivery_notes),
      picked_up_by: normalizeNullableString(body?.picked_up_by),
      picked_up_at: normalizeNullableDate(body?.picked_up_at),
    }

    const { data, error } = await supabaseAdmin
      .from("b2b_order_snapshots")
      .update(payload)
      .eq("order_id", orderId)
      .select("*")
      .maybeSingle()

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          error: `No fue posible actualizar el despacho. ${error.message}`,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      snapshot: data || null,
    })
  } catch (error) {
    console.error("[B2B_ORDER_SNAPSHOTS_UPDATE_DELIVERY] unexpected error", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Ocurrió un error actualizando el despacho.",
      },
      { status: 500 }
    )
  }
}