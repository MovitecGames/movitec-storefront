import { NextRequest, NextResponse } from "next/server"
import { getEnviaConfig } from "../../../../../lib/envia/config"

function cleanString(value: string) {
  return String(value || "").replace(/\s+/g, " ").trim()
}

function normalizeCountry(value: string) {
  return cleanString(value || "CO").toUpperCase().slice(0, 2)
}

function getQueriesBaseUrl() {
  const env = cleanString(
    process.env.ENVIA_ENV || process.env.ENVIA_ENVIRONMENT || ""
  ).toLowerCase()

  if (env === "test" || env === "sandbox") {
    return "https://queries-test.envia.com"
  }

  return "https://queries.envia.com"
}

async function parseJsonSafe(response: Response) {
  const text = await response.text()

  try {
    return text ? JSON.parse(text) : null
  } catch {
    return { raw: text }
  }
}

export async function GET(req: NextRequest) {
  try {
    const config = getEnviaConfig()
    const { searchParams } = new URL(req.url)

    const country = normalizeCountry(searchParams.get("country") || "CO")
    const shipmentType = cleanString(searchParams.get("shipmentType") || "")
    const international = cleanString(searchParams.get("international") || "0")

    const baseUrl = getQueriesBaseUrl()

    let url = `${baseUrl}/carrier?country_code=${country}`

    if (shipmentType) {
      url = `${baseUrl}/available-carrier/${country}/${international}/${shipmentType}`
    }

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${config.apiToken}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    })

    const data = await parseJsonSafe(response)

    return NextResponse.json({
      ok: response.ok,
      status: response.status,
      url,
      data,
    })
  } catch (error) {
    console.error("[ENVIA_QUERY_CARRIERS] unexpected error", error)

    return NextResponse.json(
      {
        ok: false,
        error: "Ocurrió un error consultando carriers de Envía.",
      },
      { status: 500 }
    )
  }
}