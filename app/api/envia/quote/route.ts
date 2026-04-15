import { NextRequest, NextResponse } from "next/server"
import { quoteWithEnvia } from "../../../../lib/envia/quote"

type JsonObject = Record<string, any>

type CartItemInput = {
  sku?: string
  name?: string
  quantity?: number
  weight_g?: number
  length_cm?: number
  width_cm?: number
  height_cm?: number
  unit_price?: number
  can_rotate?: boolean
  ships_alone?: boolean
}

type DestinationInput = {
  name?: string
  company?: string
  email?: string
  phone?: string
  street?: string
  city?: string
  state?: string
  country?: string
  postalCode?: string
  cityCode?: string
}

function cleanString(value: unknown) {
  return String(value || "").replace(/\s+/g, " ").trim()
}

function normalizeDigits(value: unknown) {
  return cleanString(value).replace(/[^\d]/g, "")
}

function toPositiveNumber(value: unknown, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function parseBodyAsObject(body: unknown): JsonObject | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return null
  }

  return body as JsonObject
}

function buildPackedPackageFromCartItems(cartItems: CartItemInput[]) {
  const normalizedItems = cartItems
    .map((item, index) => {
      const quantity = Math.max(1, Math.trunc(toPositiveNumber(item.quantity, 1)))
      const weightG = toPositiveNumber(item.weight_g, 1)
      const lengthCm = toPositiveNumber(item.length_cm, 1)
      const widthCm = toPositiveNumber(item.width_cm, 1)
      const heightCm = toPositiveNumber(item.height_cm, 1)
      const unitPrice = toPositiveNumber(item.unit_price, 0)
      const name = cleanString(item.name || item.sku || `Producto ${index + 1}`)

      return {
        sku: cleanString(item.sku || `ITEM-${index + 1}`),
        name,
        quantity,
        weightG,
        lengthCm,
        widthCm,
        heightCm,
        unitPrice,
        volumeCm3: lengthCm * widthCm * heightCm * quantity,
      }
    })
    .filter((item) => item.quantity > 0)

  if (!normalizedItems.length) {
    return {
      packages: [],
      packingSummary: {
        total_weight_g: 0,
        total_declared_value: 0,
        total_volume_cm3: 0,
        boxes_used: 0,
        items: [],
      },
    }
  }

  const totalWeightG = normalizedItems.reduce(
    (acc, item) => acc + item.weightG * item.quantity,
    0
  )

  const totalDeclaredValue = normalizedItems.reduce(
    (acc, item) => acc + item.unitPrice * item.quantity,
    0
  )

  const baseLength = Math.max(...normalizedItems.map((item) => item.lengthCm), 1)
  const baseWidth = Math.max(...normalizedItems.map((item) => item.widthCm), 1)
  const totalVolume = normalizedItems.reduce((acc, item) => acc + item.volumeCm3, 0)

  const computedHeight = Math.max(
    1,
    Math.ceil(totalVolume / Math.max(baseLength * baseWidth, 1))
  )

  const contentLabel = normalizedItems
    .slice(0, 3)
    .map((item) => item.name)
    .join(", ")
    .slice(0, 60)

  return {
    packages: [
      {
        type: "box" as const,
        content: contentLabel || "Pedido Movitec Games",
        amount: 1,
        declaredValue: totalDeclaredValue,
        weight: Number((totalWeightG / 1000).toFixed(2)),
        weightUnit: "KG" as const,
        lengthUnit: "CM" as const,
        dimensions: {
          length: baseLength,
          width: baseWidth,
          height: computedHeight,
        },
      },
    ],
    packingSummary: {
      total_weight_g: totalWeightG,
      total_declared_value: totalDeclaredValue,
      total_volume_cm3: totalVolume,
      boxes_used: 1,
      items: normalizedItems.map((item) => ({
        sku: item.sku,
        qty: item.quantity,
      })),
    },
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    const parsed = parseBodyAsObject(body)

    if (!parsed) {
      return NextResponse.json(
        {
          ok: false,
          error: "Debes enviar un body JSON válido.",
        },
        { status: 400 }
      )
    }

    const destination = parseBodyAsObject(parsed.destination)
    const cartItems = Array.isArray(parsed.cartItems)
      ? (parsed.cartItems as CartItemInput[])
      : []

    if (!destination) {
      return NextResponse.json(
        {
          ok: false,
          error: "Debes enviar un destino válido.",
        },
        { status: 400 }
      )
    }

    if (!cartItems.length) {
      return NextResponse.json(
        {
          ok: false,
          error: "Debes enviar al menos un item del carrito para cotizar.",
        },
        { status: 400 }
      )
    }

    const normalizedDestination: DestinationInput = {
      name: cleanString(destination.name || "Cliente Movitec"),
      company: cleanString(destination.company),
      email: cleanString(destination.email),
      phone: cleanString(destination.phone || "0000000000"),
      street: cleanString(destination.street),
      city: cleanString(destination.city),
      state: cleanString(destination.state),
      country: cleanString(destination.country || "CO").toUpperCase(),
      postalCode: cleanString(destination.postalCode),
      cityCode: normalizeDigits(destination.cityCode),
    }

    if (
      !normalizedDestination.name ||
      !normalizedDestination.street ||
      !normalizedDestination.city ||
      !normalizedDestination.state ||
      !normalizedDestination.country ||
      !normalizedDestination.postalCode
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Faltan nombre, dirección, ciudad, departamento, país o código postal para cotizar con Envía.",
        },
        { status: 400 }
      )
    }

    if (!normalizedDestination.cityCode) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Debes validar primero el código postal para obtener el código oficial de ciudad.",
        },
        { status: 400 }
      )
    }

    const packed = buildPackedPackageFromCartItems(cartItems)

    if (!packed.packages.length) {
      return NextResponse.json(
        {
          ok: false,
          error: "No fue posible construir un paquete válido para cotizar.",
        },
        { status: 400 }
      )
    }

    const quoteResult = await quoteWithEnvia({
      destination: {
        name: normalizedDestination.name || "Cliente Movitec",
        company: normalizedDestination.company || "",
        email: normalizedDestination.email || "",
        phone: normalizedDestination.phone || "0000000000",
        street: normalizedDestination.street || "",
        city: normalizedDestination.city || "",
        state: normalizedDestination.state || "",
        country: normalizedDestination.country || "CO",
        postalCode: normalizedDestination.postalCode || "",
        cityCode: normalizedDestination.cityCode || "",
      },
      packages: packed.packages,
    })

    if (!quoteResult.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: quoteResult.error || "Envía no devolvió cotizaciones válidas.",
          response: [],
          quotes: [],
          failedQuotes: quoteResult.failedQuotes || [],
          carriersTried: quoteResult.carriersTried || [],
          addressValidation: quoteResult.addressValidation || null,
          destinationStateLookup: quoteResult.destinationStateLookup || null,
          originStateLookup: quoteResult.originStateLookup || null,
          packingSummary: packed.packingSummary,
          payload: {
            destination: normalizedDestination,
            packages: packed.packages,
          },
        },
        { status: quoteResult.status || 400 }
      )
    }

    return NextResponse.json(
      {
        ok: true,
        error: null,
        enviaStatus: 200,
        response: quoteResult.response || [],
        quotes: quoteResult.quotes || [],
        failedQuotes: quoteResult.failedQuotes || [],
        carriersTried: quoteResult.carriersTried || [],
        addressValidation: quoteResult.addressValidation || null,
        destinationStateLookup: quoteResult.destinationStateLookup || null,
        originStateLookup: quoteResult.originStateLookup || null,
        packingSummary: packed.packingSummary,
        payload: {
          destination: normalizedDestination,
          packages: packed.packages,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("[ENVIA_QUOTE_ROUTE] unexpected error", error)

    return NextResponse.json(
      {
        ok: false,
        error: "Ocurrió un error cotizando con Envía.",
      },
      { status: 500 }
    )
  }
}
