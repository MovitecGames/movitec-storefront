import { NextRequest, NextResponse } from "next/server"

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim()
}

function normalizeDestinationAddress(value: string) {
  return normalizeWhitespace(value).replace(/\bNo\b\.?/gi, "#")
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const rawAddress = String(body?.address || "").trim()

    if (!rawAddress) {
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

    const normalizedOrigin = normalizeWhitespace(originAddress)
    const normalizedDestination = normalizeDestinationAddress(rawAddress)

    const origin = encodeURIComponent(normalizedOrigin)
    const destination = encodeURIComponent(normalizedDestination)

    const url =
      `https://maps.googleapis.com/maps/api/distancematrix/json` +
      `?origins=${origin}` +
      `&destinations=${destination}` +
      `&mode=driving` +
      `&language=es-419` +
      `&region=co` +
      `&key=${apiKey}`

    console.log("[BOGOTA_DISTANCE] origin:", normalizedOrigin)
    console.log("[BOGOTA_DISTANCE] destination:", normalizedDestination)

    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
    })

    if (!response.ok) {
      const responseText = await response.text().catch(() => "")

      console.error("[BOGOTA_DISTANCE] google http error", {
        status: response.status,
        statusText: response.statusText,
        body: responseText,
      })

      return NextResponse.json(
        {
          error: "No fue posible consultar Google Maps.",
          google_http_status: response.status,
        },
        { status: 502 }
      )
    }

    const data = await response.json()

    if (data?.status && data.status !== "OK") {
      console.error("[BOGOTA_DISTANCE] google api status error", {
        status: data.status,
        origin: normalizedOrigin,
        destination: normalizedDestination,
      })

      return NextResponse.json(
        {
          error: "Google Maps devolvió un estado inválido para la consulta.",
          google_status: data.status,
        },
        { status: 400 }
      )
    }

    const element = data?.rows?.[0]?.elements?.[0]
    const elementStatus = element?.status

    if (elementStatus !== "OK") {
      console.error("[BOGOTA_DISTANCE] google element status error", {
        elementStatus,
        origin: normalizedOrigin,
        destination: normalizedDestination,
      })

      return NextResponse.json(
        {
          error:
            "Google Maps no pudo calcular la distancia para esa dirección.",
          google_status: elementStatus || null,
          originAddress: normalizedOrigin,
          destinationAddress: normalizedDestination,
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
      originAddress: normalizedOrigin,
      destinationAddress: normalizedDestination,
    })
  } catch (error) {
    console.error("[BOGOTA_DISTANCE] unexpected error", error)

    return NextResponse.json(
      { error: "Ocurrió un error calculando la distancia de Bogotá." },
      { status: 500 }
    )
  }
}