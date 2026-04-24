import { NextResponse } from "next/server"
import { supabaseAdmin } from "../../../../lib/supabase-admin"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)

    const orderId = String(searchParams.get("order_id") || "").trim()
    const customerEmail = String(searchParams.get("customer_email") || "")
      .trim()
      .toLowerCase()

    if (orderId) {
      const { data, error } = await supabaseAdmin
        .from("b2b_order_snapshots")
        .select("*")
        .eq("order_id", orderId)
        .maybeSingle()

      if (error) {
        return NextResponse.json(
          {
            ok: false,
            error: `No fue posible consultar el snapshot del pedido. ${error.message}`,
          },
          { status: 500 }
        )
      }

      return NextResponse.json({
        ok: true,
        snapshot: data || null,
      })
    }

    if (customerEmail) {
      const { data, error } = await supabaseAdmin
        .from("b2b_order_snapshots")
        .select("*")
        .eq("customer_email", customerEmail)
        .order("created_at", { ascending: false })

      if (error) {
        return NextResponse.json(
          {
            ok: false,
            error: `No fue posible consultar los snapshots del cliente. ${error.message}`,
          },
          { status: 500 }
        )
      }

      return NextResponse.json({
        ok: true,
        snapshots: data || [],
      })
    }

    const { data, error } = await supabaseAdmin
      .from("b2b_order_snapshots")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          error: `No fue posible consultar los snapshots. ${error.message}`,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      snapshots: data || [],
    })
  } catch (error) {
    console.error("[B2B_ORDER_SNAPSHOTS_GET] unexpected error", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Ocurrió un error consultando los snapshots.",
      },
      { status: 500 }
    )
  }
}