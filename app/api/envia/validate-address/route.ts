import { NextRequest, NextResponse } from "next/server"
import { validateColombianAddress } from "../../../../lib/envia/geocodes"

function cleanString(value: unknown) {
  return String(value || "").replace(/\s+/g, " ").trim()
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        {
          ok: false,
          error: "Debes enviar un body JSON válido.",
        },
        { status: 400 }
      )
    }

    const city = cleanString(body?.city)
    const state = cleanString(body?.state)
    const postalCode = cleanString(body?.postalCode)
    const country = cleanString(body?.country || "CO").toUpperCase()

    if (!city && !postalCode) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Debes enviar al menos ciudad o código postal para validar con Envía.",
        },
        { status: 422 }
      )
    }

    const result = await validateColombianAddress({
      city,
      state,
      postalCode,
      country,
    })

    if (!result.ok) {
      return NextResponse.json(result, { status: 400 })
    }

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error("[ENVIA_VALIDATE_ADDRESS] unexpected error", error)

    return NextResponse.json(
      {
        ok: false,
        error: "Ocurrió un error validando la dirección con Envía.",
      },
      { status: 500 }
    )
  }
}