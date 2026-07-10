import { NextRequest, NextResponse } from "next/server"

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim()
}

function normalizeDestinationAddress(value: string) {
  return normalizeWhitespace(value).replace(/\bNo\b\.?/gi, "#")
}

function getGoogleErrorMessage(data: any) {
  const googleStatus = String(data?.status || "").trim()
  const googleErrorMessage = String(data?.error_message || "").trim()

  if (googleErrorMessage) {
    return googleErrorMessage
  }

  if (googleStatus === "REQUEST_DENIED") {
    return "Google Maps rechazó la consulta. Revisa que Distance Matrix API esté habilitada, que la facturación esté activa y que la llave permita solicitudes desde el servidor."
  }

  if (googleStatus === "OVER_DAILY_LIMIT") {
    return "Google Maps rechazó la consulta por límites, facturación o configuración de la llave."
  }

  if (googleStatus === "OVER_QUERY_LIMIT") {
    return "Se superó temporalmente la cuota de consultas de Google Maps."
  }

  if (googleStatus === "INVALID_REQUEST") {
    return "Google Maps recibió una solicitud incompleta o inválida."
  }

  if (googleStatus === "UNKNOWN_ERROR") {
    return "Google Maps presentó un error temporal. Intenta nuevamente."
  }

  return `Google Maps devolvió el estado ${googleStatus || "desconocido"}.`
}

function getElementErrorMessage(elementStatus: string) {
  if (elementStatus === "NOT_FOUND") {
    return "Google Maps no pudo localizar el origen o la dirección de destino."
  }

  if (elementStatus === "ZERO_RESULTS") {
    return "Google Maps localizó la dirección, pero no encontró una ruta vehicular válida."
  }

  if (elementStatus === "MAX_ROUTE_LENGTH_EXCEEDED") {
    return "La ruta solicitada supera la longitud admitida por Google Maps."
  }

  return `Google Maps no pudo calcular la ruta. Estado: ${
    elementStatus || "desconocido"
  }.`
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    const rawAddress = String(body?.address || "").trim()

    if (!rawAddress) {
      return NextResponse.json(
        {
          ok: false,
          error: "Debes enviar una dirección válida.",
        },
        { status: 400 }
      )
    }

    const apiKey = String(process.env.GOOGLE_MAPS_API_KEY || "").trim()
    const originAddress = String(
      process.env.BOGOTA_ORIGIN_ADDRESS || ""
    ).trim()

    if (!apiKey || !originAddress) {
      console.error("[BOGOTA_DISTANCE] missing environment variables", {
        hasGoogleMapsApiKey: Boolean(apiKey),
        hasBogotaOriginAddress: Boolean(originAddress),
      })

      return NextResponse.json(
        {
          ok: false,
          error: "Faltan variables de entorno para Google Maps.",
        },
        { status: 500 }
      )
    }

    const normalizedOrigin = normalizeWhitespace(originAddress)
    const normalizedDestination =
      normalizeDestinationAddress(rawAddress)

    const origin = encodeURIComponent(normalizedOrigin)
    const destination = encodeURIComponent(normalizedDestination)

    const url =
      `https://maps.googleapis.com/maps/api/distancematrix/json` +
      `?origins=${origin}` +
      `&destinations=${destination}` +
      `&mode=driving` +
      `&language=es-419` +
      `&region=co` +
      `&key=${encodeURIComponent(apiKey)}`

    console.log("[BOGOTA_DISTANCE] request", {
      origin: normalizedOrigin,
      destination: normalizedDestination,
    })

    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
    })

    const responseText = await response.text().catch(() => "")

    if (!response.ok) {
      console.error("[BOGOTA_DISTANCE] google http error", {
        status: response.status,
        statusText: response.statusText,
        body: responseText,
      })

      return NextResponse.json(
        {
          ok: false,
          error: "No fue posible consultar Google Maps.",
          google_http_status: response.status,
          google_http_status_text: response.statusText,
        },
        { status: 502 }
      )
    }

    let data: any = null

    try {
      data = responseText ? JSON.parse(responseText) : null
    } catch (parseError) {
      console.error("[BOGOTA_DISTANCE] invalid google json", {
        parseError,
        body: responseText,
      })

      return NextResponse.json(
        {
          ok: false,
          error: "Google Maps devolvió una respuesta inválida.",
        },
        { status: 502 }
      )
    }

    const googleStatus = String(data?.status || "").trim()

    if (googleStatus !== "OK") {
      const googleErrorMessage = String(
        data?.error_message || ""
      ).trim()

      console.error("[BOGOTA_DISTANCE] google api status error", {
        status: googleStatus,
        errorMessage: googleErrorMessage,
        origin: normalizedOrigin,
        destination: normalizedDestination,
      })

      return NextResponse.json(
        {
          ok: false,
          error: getGoogleErrorMessage(data),
          google_status: googleStatus || null,
          google_error_message: googleErrorMessage || null,
          originAddress: normalizedOrigin,
          destinationAddress: normalizedDestination,
        },
        { status: 400 }
      )
    }

    const originAddresses = Array.isArray(data?.origin_addresses)
      ? data.origin_addresses
      : []

    const destinationAddresses = Array.isArray(
      data?.destination_addresses
    )
      ? data.destination_addresses
      : []

    const element = data?.rows?.[0]?.elements?.[0]
    const elementStatus = String(element?.status || "").trim()

    if (elementStatus !== "OK") {
      console.error("[BOGOTA_DISTANCE] google element status error", {
        elementStatus,
        origin: normalizedOrigin,
        destination: normalizedDestination,
        resolvedOrigin: originAddresses[0] || "",
        resolvedDestination: destinationAddresses[0] || "",
      })

      return NextResponse.json(
        {
          ok: false,
          error: getElementErrorMessage(elementStatus),
          google_status: elementStatus || null,
          originAddress: normalizedOrigin,
          destinationAddress: normalizedDestination,
          resolvedOriginAddress: originAddresses[0] || null,
          resolvedDestinationAddress:
            destinationAddresses[0] || null,
        },
        { status: 400 }
      )
    }

    const distanceMeters = Number(element?.distance?.value || 0)
    const durationSeconds = Number(element?.duration?.value || 0)
    const distanceText = String(element?.distance?.text || "")
    const durationText = String(element?.duration?.text || "")

    if (
      !Number.isFinite(distanceMeters) ||
      distanceMeters <= 0 ||
      !Number.isFinite(durationSeconds)
    ) {
      console.error("[BOGOTA_DISTANCE] invalid distance result", {
        distanceMeters,
        durationSeconds,
        element,
      })

      return NextResponse.json(
        {
          ok: false,
          error:
            "Google Maps respondió correctamente, pero no entregó una distancia válida.",
        },
        { status: 502 }
      )
    }

    return NextResponse.json({
      ok: true,
      distanceMeters,
      distanceKm: distanceMeters / 1000,
      durationSeconds,
      distanceText,
      durationText,
      originAddress:
        originAddresses[0] || normalizedOrigin,
      destinationAddress:
        destinationAddresses[0] || normalizedDestination,
    })
  } catch (error) {
    console.error("[BOGOTA_DISTANCE] unexpected error", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Ocurrió un error calculando la distancia de Bogotá.",
      },
      { status: 500 }
    )
  }
}