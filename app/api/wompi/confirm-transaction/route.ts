import { NextResponse } from "next/server"
import { confirmWompiOrder } from "../../../../lib/wompi-confirm-order"
import { supabaseAdmin } from "../../../../lib/supabase-admin"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type RequestBody = {
  transactionId?: string
  transaction_id?: string
  id?: string
  reference?: string
}

type WompiTransaction = {
  id?: string
  reference?: string
  status?: string
  status_message?: string
  amount_in_cents?: number
  currency?: string
  payment_method_type?: string
  finalized_at?: string
  created_at?: string
  customer_email?: string
  [key: string]: any
}

function normalizeWhitespace(value: unknown) {
  return String(value || "").replace(/\s+/g, " ").trim()
}

function getWompiApiBaseUrl() {
  const configuredUrl = normalizeWhitespace(
    process.env.WOMPI_API_URL
  )

  if (configuredUrl) {
    return configuredUrl.replace(/\/+$/, "")
  }

  const publicKey = normalizeWhitespace(
    process.env.WOMPI_PUBLIC_KEY
  ).toLowerCase()

  if (
    publicKey.startsWith("pub_test_") ||
    publicKey.includes("_test_")
  ) {
    return "https://sandbox.wompi.co/v1"
  }

  return "https://production.wompi.co/v1"
}

function getWompiPrivateKey() {
  return normalizeWhitespace(
    process.env.WOMPI_PRIVATE_KEY ||
      process.env.WOMPI_SECRET_KEY ||
      process.env.WOMPI_PRIVATE_API_KEY
  )
}

function getTransactionFromResponse(
  payload: any
): WompiTransaction | null {
  if (
    payload?.data &&
    typeof payload.data === "object" &&
    !Array.isArray(payload.data)
  ) {
    return payload.data as WompiTransaction
  }

  if (
    payload?.transaction &&
    typeof payload.transaction === "object" &&
    !Array.isArray(payload.transaction)
  ) {
    return payload.transaction as WompiTransaction
  }

  if (
    payload &&
    typeof payload === "object" &&
    !Array.isArray(payload) &&
    payload.id
  ) {
    return payload as WompiTransaction
  }

  return null
}

async function findTransactionIdByReference(
  reference: string
) {
  const { data, error } = await supabaseAdmin
    .from("b2b_wompi_payment_intents")
    .select("wompi_transaction_id")
    .eq("reference", reference)
    .maybeSingle()

  if (error) {
    throw new Error(
      `No fue posible consultar la referencia del pago. ${error.message}`
    )
  }

  return normalizeWhitespace(data?.wompi_transaction_id)
}

async function fetchWompiTransaction(
  transactionId: string
) {
  const wompiPrivateKey = getWompiPrivateKey()

  if (!wompiPrivateKey) {
    throw new Error(
      "Falta configurar WOMPI_PRIVATE_KEY en las variables de entorno."
    )
  }

  const wompiApiBaseUrl = getWompiApiBaseUrl()

  const response = await fetch(
    `${wompiApiBaseUrl}/transactions/${encodeURIComponent(
      transactionId
    )}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${wompiPrivateKey}`,
        Accept: "application/json",
      },
      cache: "no-store",
    }
  )

  const responseText = await response.text()

  let payload: any = null

  if (responseText) {
    try {
      payload = JSON.parse(responseText)
    } catch {
      payload = {
        raw_response: responseText,
      }
    }
  }

  if (!response.ok) {
    const wompiMessage =
      normalizeWhitespace(payload?.error?.reason) ||
      normalizeWhitespace(payload?.error?.message) ||
      normalizeWhitespace(payload?.message) ||
      normalizeWhitespace(responseText)

    throw new Error(
      wompiMessage
        ? `Wompi rechazó la consulta de la transacción. ${wompiMessage}`
        : `Wompi rechazó la consulta de la transacción con estado HTTP ${response.status}.`
    )
  }

  const transaction = getTransactionFromResponse(payload)

  if (!transaction?.id) {
    throw new Error(
      "Wompi respondió la consulta, pero no entregó una transacción válida."
    )
  }

  if (
    normalizeWhitespace(transaction.id) !==
    normalizeWhitespace(transactionId)
  ) {
    throw new Error(
      "La transacción consultada no coincide con la transacción respondida por Wompi."
    )
  }

  return transaction
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as
      | RequestBody
      | null

    const suppliedTransactionId = normalizeWhitespace(
      body?.transactionId ||
        body?.transaction_id ||
        body?.id
    )

    const suppliedReference = normalizeWhitespace(
      body?.reference
    )

    let transactionId = suppliedTransactionId

    if (!transactionId && suppliedReference) {
      transactionId =
        await findTransactionIdByReference(
          suppliedReference
        )
    }

    if (!transactionId) {
      return NextResponse.json(
        {
          ok: false,
          processed: false,
          error:
            "No se recibió un identificador válido de la transacción Wompi.",
        },
        {
          status: 400,
        }
      )
    }

    const transaction =
      await fetchWompiTransaction(transactionId)

    const wompiReference = normalizeWhitespace(
      transaction.reference
    )

    if (!wompiReference) {
      return NextResponse.json(
        {
          ok: false,
          processed: false,
          error:
            "La transacción consultada en Wompi no contiene una referencia.",
          transaction: {
            id: normalizeWhitespace(transaction.id),
            status: normalizeWhitespace(
              transaction.status
            ).toUpperCase(),
          },
        },
        {
          status: 400,
        }
      )
    }

    if (
      suppliedReference &&
      suppliedReference !== wompiReference
    ) {
      return NextResponse.json(
        {
          ok: false,
          processed: false,
          error:
            "La referencia recibida no coincide con la referencia registrada por Wompi.",
          transaction: {
            id: normalizeWhitespace(transaction.id),
            reference: wompiReference,
            status: normalizeWhitespace(
              transaction.status
            ).toUpperCase(),
          },
        },
        {
          status: 400,
        }
      )
    }

    const confirmation =
      await confirmWompiOrder(transaction)

    if (!confirmation.ok) {
      return NextResponse.json(
        confirmation,
        {
          status: 400,
        }
      )
    }

    return NextResponse.json(
      confirmation,
      {
        status: 200,
      }
    )
  } catch (error) {
    console.error(
      "[WOMPI_CONFIRM_TRANSACTION] unexpected error",
      error
    )

    return NextResponse.json(
      {
        ok: false,
        processed: false,
        error:
          error instanceof Error
            ? error.message
            : "Ocurrió un error confirmando la transacción con Wompi.",
      },
      {
        status: 500,
      }
    )
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)

    const transactionId = normalizeWhitespace(
      url.searchParams.get("id") ||
        url.searchParams.get("transaction_id") ||
        url.searchParams.get("transactionId")
    )

    const reference = normalizeWhitespace(
      url.searchParams.get("reference")
    )

    if (!transactionId) {
      return NextResponse.json(
        {
          ok: false,
          processed: false,
          error:
            "No se recibió el identificador de la transacción Wompi.",
        },
        {
          status: 400,
        }
      )
    }

    const transaction =
      await fetchWompiTransaction(transactionId)

    const wompiReference = normalizeWhitespace(
      transaction.reference
    )

    if (
      reference &&
      reference !== wompiReference
    ) {
      return NextResponse.json(
        {
          ok: false,
          processed: false,
          error:
            "La referencia recibida no coincide con la referencia registrada por Wompi.",
        },
        {
          status: 400,
        }
      )
    }

    const confirmation =
      await confirmWompiOrder(transaction)

    if (!confirmation.ok) {
      return NextResponse.json(
        confirmation,
        {
          status: 400,
        }
      )
    }

    return NextResponse.json(
      confirmation,
      {
        status: 200,
      }
    )
  } catch (error) {
    console.error(
      "[WOMPI_CONFIRM_TRANSACTION_GET] unexpected error",
      error
    )

    return NextResponse.json(
      {
        ok: false,
        processed: false,
        error:
          error instanceof Error
            ? error.message
            : "Ocurrió un error confirmando la transacción con Wompi.",
      },
      {
        status: 500,
      }
    )
  }
}