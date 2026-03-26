import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const address = String(body?.address || "").trim()

    if (!address) {
      return NextResponse.json(
        { error: "Debes enviar una dirección válida." },
        { status: 400 }
      )
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY
    const originAddress = process.env.BOGOTA_ORIGIN_ADDRESS

    if (!apiKey || !originAddress) {
      return NextResponse.json(
        { error: "Faltan variables de entorno para Google Maps." },
        { status: 500 }
      )
    }

    const origin = encodeURIComponent(originAddress)
    const destination = encodeURIComponent(address)

    const url =
      `https://maps.googleapis.com/maps/api/distancematrix/json` +
      `?origins=${origin}` +
      `&destinations=${destination}` +
      `&mode=driving` +
      `&language=es-419` +
      `&region=co` +
      `&key=${apiKey}`

    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: "No fue posible consultar Google Maps." },
        { status: 502 }
      )
    }

    const data = await response.json()

    const element = data?.rows?.[0]?.elements?.[0]
    const status = element?.status

    if (status !== "OK") {
      return NextResponse.json(
        {
          error:
            "Google Maps no pudo calcular la distancia para esa dirección.",
          google_status: status || null,
        },
        { status: 400 }
      )
    }

    const distanceMeters = Number(element?.distance?.value || 0)
    const durationSeconds = Number(element?.duration?.value || 0)
    const distanceText = String(element?.distance?.text || "")
    const durationText = String(element?.duration?.text || "")

    return NextResponse.json({
      ok: true,
      distanceMeters,
      distanceKm: distanceMeters / 1000,
      durationSeconds,
      distanceText,
      durationText,
      destinationAddress: address,
    })
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      { error: "Ocurrió un error calculando la distancia de Bogotá." },
      { status: 500 }
    )
  }
}