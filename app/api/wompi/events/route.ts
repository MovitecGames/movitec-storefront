import { NextResponse } from "next/server"
import {
  createHash,
  timingSafeEqual,
} from "crypto"
import { confirmWompiOrder } from "../../../../lib/wompi-confirm-order"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type WompiEventPayload = {
  event?: string
  data?: Record<string, any>
  environment?: string
  signature?: {
    properties?: string[]
    checksum?: string
  }
  timestamp?: number | string
  sent_at?: string
  [key: string]: any
}

function normalizeWhitespace(value: unknown) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
}

function getEventsSecret() {
  return normalizeWhitespace(
    process.env.WOMPI_EVENTS_SECRET ||
      process.env.WOMPI_EVENT_SECRET
  )
}

function getNestedValue(
  source: Record<string, any>,
  path: string
): unknown {
  const parts = String(path || "")
    .split(".")
    .map((part) => part.trim())
    .filter(Boolean)

  let current: any = source

  for (const part of parts) {
    if (
      current === null ||
      current === undefined ||
      typeof current !== "object" ||
      !(part in current)
    ) {
      return undefined
    }

    current = current[part]
  }

  return current
}

function stringifySignatureValue(value: unknown) {
  if (value === null || value === undefined) {
    return ""
  }

  if (typeof value === "string") {
    return value
  }

  if (
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "bigint"
  ) {
    return String(value)
  }

  return JSON.stringify(value)
}

function buildEventChecksum(params: {
  payload: WompiEventPayload
  eventsSecret: string
}) {
  const properties = Array.isArray(
    params.payload.signature?.properties
  )
    ? params.payload.signature?.properties || []
    : []

  const data =
    params.payload.data &&
    typeof params.payload.data === "object" &&
    !Array.isArray(params.payload.data)
      ? params.payload.data
      : {}

  const propertyValues = properties.map((propertyPath) => {
    const value = getNestedValue(data, propertyPath)

    if (value === undefined) {
      throw new Error(
        `No se encontró la propiedad de firma "${propertyPath}" dentro de data.`
      )
    }

    return stringifySignatureValue(value)
  })

  const timestamp = stringifySignatureValue(
    params.payload.timestamp
  )

  if (!timestamp) {
    throw new Error(
      "El evento no contiene un timestamp válido."
    )
  }

  const source = `${propertyValues.join("")}${timestamp}${params.eventsSecret}`

  return createHash("sha256")
    .update(source)
    .digest("hex")
    .toLowerCase()
}

function safeChecksumComparison(
  calculatedChecksum: string,
  receivedChecksum: string
) {
  const calculatedBuffer = Buffer.from(
    calculatedChecksum.toLowerCase(),
    "utf8"
  )

  const receivedBuffer = Buffer.from(
    receivedChecksum.toLowerCase(),
    "utf8"
  )

  if (
    calculatedBuffer.length !== receivedBuffer.length
  ) {
    return false
  }

  return timingSafeEqual(
    calculatedBuffer,
    receivedBuffer
  )
}

function getHeaderChecksum(req: Request) {
  return normalizeWhitespace(
    req.headers.get("x-event-checksum")
  )
}

function validateEnvironment(
  environment: string
) {
  const expectedEnvironment = normalizeWhitespace(
    process.env.WOMPI_ENVIRONMENT
  ).toLowerCase()

  if (!expectedEnvironment) {
    return true
  }

  const normalizedReceived =
    environment.toLowerCase()

  const expectedAliases =
    expectedEnvironment === "production"
      ? ["prod", "production"]
      : expectedEnvironment === "sandbox"
      ? ["test", "sandbox"]
      : [expectedEnvironment]

  return expectedAliases.includes(
    normalizedReceived
  )
}

export async function POST(req: Request) {
  try {
    const eventsSecret = getEventsSecret()

    if (!eventsSecret) {
      console.error(
        "[WOMPI_EVENTS] Falta WOMPI_EVENTS_SECRET."
      )

      return NextResponse.json(
        {
          ok: false,
          error:
            "El secreto de eventos de Wompi no está configurado.",
        },
        {
          status: 500,
        }
      )
    }

    const rawBody = await req.text()

    if (!rawBody) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Wompi no envió contenido en el evento.",
        },
        {
          status: 400,
        }
      )
    }

    let payload: WompiEventPayload

    try {
      payload = JSON.parse(rawBody)
    } catch {
      return NextResponse.json(
        {
          ok: false,
          error:
            "El cuerpo recibido no contiene un JSON válido.",
        },
        {
          status: 400,
        }
      )
    }

    const eventName = normalizeWhitespace(
      payload.event
    )

    const environment = normalizeWhitespace(
      payload.environment
    )

    if (
      environment &&
      !validateEnvironment(environment)
    ) {
      console.error(
        "[WOMPI_EVENTS] Ambiente no permitido.",
        {
          received: environment,
        }
      )

      return NextResponse.json(
        {
          ok: false,
          error:
            "El ambiente del evento no coincide con el ambiente configurado.",
        },
        {
          status: 400,
        }
      )
    }

    const signatureProperties = Array.isArray(
      payload.signature?.properties
    )
      ? payload.signature?.properties || []
      : []

    if (signatureProperties.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "El evento no contiene las propiedades necesarias para validar su firma.",
        },
        {
          status: 400,
        }
      )
    }

    const bodyChecksum = normalizeWhitespace(
      payload.signature?.checksum
    )

    const headerChecksum =
      getHeaderChecksum(req)

    const receivedChecksum =
      bodyChecksum || headerChecksum

    if (!receivedChecksum) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "El evento no contiene un checksum.",
        },
        {
          status: 401,
        }
      )
    }

    if (
      bodyChecksum &&
      headerChecksum &&
      bodyChecksum.toLowerCase() !==
        headerChecksum.toLowerCase()
    ) {
      console.error(
        "[WOMPI_EVENTS] El checksum del encabezado no coincide con el checksum del cuerpo."
      )

      return NextResponse.json(
        {
          ok: false,
          error:
            "Los checksums recibidos no coinciden.",
        },
        {
          status: 401,
        }
      )
    }

    let calculatedChecksum = ""

    try {
      calculatedChecksum =
        buildEventChecksum({
          payload,
          eventsSecret,
        })
    } catch (signatureError) {
      console.error(
        "[WOMPI_EVENTS] No fue posible construir la firma.",
        signatureError
      )

      return NextResponse.json(
        {
          ok: false,
          error:
            signatureError instanceof Error
              ? signatureError.message
              : "No fue posible validar la firma del evento.",
        },
        {
          status: 400,
        }
      )
    }

    const checksumIsValid =
      safeChecksumComparison(
        calculatedChecksum,
        receivedChecksum
      )

    if (!checksumIsValid) {
      console.error(
        "[WOMPI_EVENTS] Firma inválida.",
        {
          event: eventName,
          environment,
        }
      )

      return NextResponse.json(
        {
          ok: false,
          error:
            "La firma del evento de Wompi no es válida.",
        },
        {
          status: 401,
        }
      )
    }

    /*
     * Wompi puede agregar otros tipos de eventos en el futuro.
     * Los eventos válidos pero no relacionados con transacciones
     * se reconocen con HTTP 200 para evitar reintentos innecesarios.
     */
    if (eventName !== "transaction.updated") {
      return NextResponse.json(
        {
          ok: true,
          ignored: true,
          event: eventName,
        },
        {
          status: 200,
        }
      )
    }

    const transaction =
      payload.data?.transaction

    if (
      !transaction ||
      typeof transaction !== "object" ||
      Array.isArray(transaction)
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "El evento transaction.updated no contiene una transacción válida.",
        },
        {
          status: 400,
        }
      )
    }

    const transactionId =
      normalizeWhitespace(transaction.id)

    const reference =
      normalizeWhitespace(
        transaction.reference
      )

    if (!transactionId || !reference) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "La transacción del evento no contiene un identificador o referencia válidos.",
        },
        {
          status: 400,
        }
      )
    }

    const confirmation =
      await confirmWompiOrder(transaction)

    /*
     * Cuando el pago todavía no está aprobado, el motor registra
     * el estado y responde correctamente sin crear una orden.
     */
    if (confirmation.ok) {
      return NextResponse.json(
        {
          ok: true,
          received: true,
          event: eventName,
          environment,
          confirmation,
        },
        {
          status: 200,
        }
      )
    }

    /*
     * Si el evento es legítimo pero hay un problema interno,
     * respondemos con error para que Wompi vuelva a intentarlo.
     */
    console.error(
      "[WOMPI_EVENTS] No fue posible procesar el evento.",
      {
        transactionId,
        reference,
        error: confirmation.error,
      }
    )

    return NextResponse.json(
      {
        ok: false,
        received: true,
        event: eventName,
        confirmation,
      },
      {
        status: 500,
      }
    )
  } catch (error) {
    console.error(
      "[WOMPI_EVENTS] unexpected error",
      error
    )

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Ocurrió un error procesando el evento de Wompi.",
      },
      {
        status: 500,
      }
    )
  }
}

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      service: "Wompi events webhook",
    },
    {
      status: 200,
    }
  )
}