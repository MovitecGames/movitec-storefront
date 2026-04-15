import { getEnviaConfig } from "./config"

type JsonObject = Record<string, unknown>

function cleanString(value: unknown) {
  return String(value || "").replace(/\s+/g, " ").trim()
}

function normalizeCountry(value: string) {
  return cleanString(value || "CO").toUpperCase().slice(0, 2)
}

function normalizeText(value: string) {
  return cleanString(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\./g, "")
    .toUpperCase()
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

async function enviaQueriesGet(
  path: string,
  searchParams?: Record<string, string>
) {
  const config = getEnviaConfig()
  const baseUrl = getQueriesBaseUrl()
  const url = new URL(`${baseUrl}${path}`)

  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      const cleaned = cleanString(value)
      if (cleaned) {
        url.searchParams.set(key, cleaned)
      }
    }
  }

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${config.apiToken}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  })

  const data = await parseJsonSafe(response)

  return {
    ok: response.ok,
    status: response.status,
    data,
    url: url.toString(),
  }
}

export async function getStatesByCountry(country = "CO") {
  const normalizedCountry = normalizeCountry(country)

  return enviaQueriesGet("/state", {
    country_code: normalizedCountry,
  })
}

export async function getAvailableCarriers(params: {
  country?: string
  shipmentType?: string
  international?: string
}) {
  const country = normalizeCountry(params.country || "CO")
  const shipmentType = cleanString(params.shipmentType || "1")
  const international = cleanString(params.international || "0")

  return enviaQueriesGet(`/available-carrier/${country}/${international}/${shipmentType}`)
}

export async function findOfficialStateCode(params: {
  country?: string
  stateName: string
}) {
  const country = normalizeCountry(params.country || "CO")
  const stateName = cleanString(params.stateName)

  if (!stateName) {
    return {
      ok: false as const,
      error: "Debes enviar un departamento o estado válido.",
    }
  }

  const statesResult = await getStatesByCountry(country)

  if (!statesResult.ok) {
    return {
      ok: false as const,
      error: "No fue posible consultar los estados oficiales de Envía.",
      status: statesResult.status,
      raw: statesResult.data,
      url: statesResult.url,
    }
  }

  const rows = Array.isArray(statesResult.data)
    ? statesResult.data
    : Array.isArray((statesResult.data as JsonObject | null)?.data)
    ? (((statesResult.data as JsonObject).data as unknown[]) || [])
    : Array.isArray((statesResult.data as JsonObject | null)?.results)
    ? (((statesResult.data as JsonObject).results as unknown[]) || [])
    : []

  const wanted = normalizeText(stateName)

  const candidates = rows
    .map((item) => item as JsonObject)
    .map((item) => {
      const name = String(
        item.name ??
          item.state ??
          item.province ??
          item.state_name ??
          item.label ??
          ""
      )

      const code = cleanString(
        String(
          item.code_shopify ??
            item.code_3_digits ??
            item.code_2_digits ??
            item.code ??
            item.state_code ??
            item.short_code ??
            item.iso_code ??
            item.abbreviation ??
            item.id ??
            ""
        )
      )

      return {
        raw: item,
        name: cleanString(name),
        code,
      }
    })
    .filter((item) => item.name || item.code)

  const exactByName = candidates.find((item) => normalizeText(item.name) === wanted)

  if (exactByName) {
    return {
      ok: true as const,
      country,
      matchType: "exact_name",
      stateName: exactByName.name,
      stateCode: exactByName.code,
      raw: exactByName.raw,
      optionsCount: candidates.length,
    }
  }

  const contains = candidates.find(
    (item) =>
      normalizeText(item.name).includes(wanted) ||
      wanted.includes(normalizeText(item.name))
  )

  if (contains) {
    return {
      ok: true as const,
      country,
      matchType: "contains",
      stateName: contains.name,
      stateCode: contains.code,
      raw: contains.raw,
      optionsCount: candidates.length,
    }
  }

  return {
    ok: false as const,
    error: "No se encontró un código oficial de estado en Envía para ese valor.",
    country,
    searched: stateName,
    optionsPreview: candidates.slice(0, 15),
  }
}