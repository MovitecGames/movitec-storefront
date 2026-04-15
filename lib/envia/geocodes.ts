import { getEnviaConfig } from "./config"

type JsonObject = Record<string, unknown>

export type EnviaZipLookupSuccess = {
  success?: boolean
  data?: unknown
  error?: unknown
}

export type EnviaLocateSuccess = {
  success?: boolean
  data?: unknown
  error?: unknown
}

function cleanString(value: unknown) {
  return String(value || "").replace(/\s+/g, " ").trim()
}

function normalizeCountry(value: string) {
  return cleanString(value || "CO").toUpperCase().slice(0, 2)
}

function normalizePostalCode(value: string) {
  return cleanString(value).replace(/[^\d]/g, "")
}

function normalizeForCompare(value: string) {
  return cleanString(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\./g, "")
    .toUpperCase()
}

function normalizeDigits(value: string) {
  return cleanString(value).replace(/[^\d]/g, "")
}

function getGeocodesBaseUrl() {
  const env = cleanString(
    process.env.ENVIA_ENV ||
      process.env.ENVIA_ENVIRONMENT ||
      process.env.ENVIA_ENV_VAR ||
      ""
  ).toLowerCase()

  if (env === "test" || env === "sandbox") {
    return "https://geocodes-test.envia.com"
  }

  return (
    cleanString(process.env.ENVIA_GEOCODES_BASE_URL || "") ||
    "https://geocodes.envia.com"
  )
}

async function parseJsonSafe(response: Response) {
  const text = await response.text()

  try {
    return text ? JSON.parse(text) : null
  } catch {
    return { raw: text }
  }
}

async function enviaGeocodeGet(path: string) {
  const config = getEnviaConfig()
  const baseUrl = getGeocodesBaseUrl()
  const url = `${baseUrl}${path}`

  const response = await fetch(url, {
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
    url,
  }
}

export async function lookupZipcode(params: {
  country?: string
  postalCode: string
}) {
  const country = normalizeCountry(params.country || "CO")
  const postalCode = normalizePostalCode(params.postalCode)

  if (!postalCode) {
    throw new Error("Debes enviar un código postal válido")
  }

  return enviaGeocodeGet(`/zipcode/${country}/${postalCode}`)
}

export async function locateCity(params: {
  country?: string
  city: string
}) {
  const country = normalizeCountry(params.country || "CO")
  const city = cleanString(params.city)

  if (!city) {
    throw new Error("Debes enviar una ciudad válida")
  }

  return enviaGeocodeGet(`/locate/${country}/${encodeURIComponent(city)}`)
}

function asObject(value: unknown): JsonObject {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonObject)
    : {}
}

function extractRowsFromUnknown(data: unknown): JsonObject[] {
  if (Array.isArray(data)) {
    return data.map((item) => asObject(item))
  }

  const obj = asObject(data)

  if (Array.isArray(obj.data)) {
    return obj.data.map((item) => asObject(item))
  }

  if (Array.isArray(obj.results)) {
    return obj.results.map((item) => asObject(item))
  }

  if (obj.data && typeof obj.data === "object") {
    return [asObject(obj.data)]
  }

  return []
}

function extractCityCode(row: JsonObject) {
  const info = asObject(row.info)

  const directCandidates = [
    row.stat_8digit,
    row.city_code,
    row.municipality_code,
    row.locality_code,
    row.code,
    info.stat_8digit,
    info.code,
  ]

  for (const candidate of directCandidates) {
    const parsed = normalizeDigits(String(candidate || ""))
    if (parsed) return parsed
  }

  const stat = normalizeDigits(String(row.stat || info.stat || ""))
  if (stat) return stat

  return ""
}

function extractZipData(data: unknown) {
  const rows = extractRowsFromUnknown(data)

  if (!rows.length) return null

  const row = rows[0]
  const countryObj = asObject(row.country)
  const stateObj = asObject(row.state)
  const coordinatesObj = asObject(row.coordinates)

  const zipcode = cleanString(
    row.zip_code || row.zipcode || row.postalCode || row.postal_code || ""
  )

  const city = cleanString(
    row.locality ||
      row.city ||
      row.municipality ||
      row.localidad ||
      row.ciudad ||
      ""
  )

  const state = cleanString(
    stateObj.name ||
      row.state_name ||
      row.state ||
      row.province ||
      row.departamento ||
      ""
  )

  const country = cleanString(
    countryObj.code || countryObj.name || row.country_code || row.country || ""
  )

  const cityCode = extractCityCode(row)

  return {
    zipcode,
    city,
    state,
    country,
    cityCode,
    coordinates: {
      latitude: cleanString(coordinatesObj.latitude || ""),
      longitude: cleanString(coordinatesObj.longitude || ""),
    },
    raw: row,
  }
}

function extractCityOptions(data: unknown) {
  const rows = extractRowsFromUnknown(data)

  return rows
    .map((row) => {
      const countryObj = asObject(row.country)
      const stateObj = asObject(row.state)

      return {
        city: cleanString(
          row.locality ||
            row.city ||
            row.municipality ||
            row.localidad ||
            row.ciudad ||
            ""
        ),
        state: cleanString(
          stateObj.name ||
            row.state_name ||
            row.state ||
            row.province ||
            row.departamento ||
            ""
        ),
        country: cleanString(
          countryObj.code || countryObj.name || row.country_code || row.country || ""
        ),
        zipcode: cleanString(
          row.zip_code || row.zipcode || row.postalCode || row.postal_code || ""
        ),
        cityCode: extractCityCode(row),
        raw: row,
      }
    })
    .filter((item) => item.city || item.state || item.zipcode || item.cityCode)
}

function pickBestCityOption(params: {
  options: ReturnType<typeof extractCityOptions>
  cityInput: string
  stateInput: string
  postalCodeInput: string
}) {
  const { options, cityInput, stateInput, postalCodeInput } = params

  if (!options.length) return null

  const normalizedCityInput = normalizeForCompare(cityInput)
  const normalizedStateInput = normalizeForCompare(stateInput)

  let scored = options.map((option) => {
    let score = 0

    if (
      normalizedCityInput &&
      normalizeForCompare(option.city) === normalizedCityInput
    ) {
      score += 10
    }

    if (
      normalizedStateInput &&
      normalizeForCompare(option.state) === normalizedStateInput
    ) {
      score += 8
    }

    if (
      postalCodeInput &&
      normalizePostalCode(option.zipcode) === normalizePostalCode(postalCodeInput)
    ) {
      score += 12
    }

    if (option.cityCode) {
      score += 3
    }

    return {
      ...option,
      score,
    }
  })

  scored.sort((a, b) => b.score - a.score)

  return scored[0] || null
}

export async function validateColombianAddress(input: {
  city?: string
  state?: string
  postalCode?: string
  country?: string
}) {
  const country = normalizeCountry(input.country || "CO")
  const cityInput = cleanString(input.city || "")
  const stateInput = cleanString(input.state || "")
  const postalCodeInput = normalizePostalCode(input.postalCode || "")

  if (!postalCodeInput && !cityInput) {
    return {
      ok: false as const,
      error: "Debes enviar al menos ciudad o código postal para validar con Envía.",
      stage: "input",
    }
  }

  let zipAttempt: Awaited<ReturnType<typeof lookupZipcode>> | null = null
  let cityAttempt: Awaited<ReturnType<typeof locateCity>> | null = null

  if (postalCodeInput) {
    try {
      zipAttempt = await lookupZipcode({
        country,
        postalCode: postalCodeInput,
      })

      const zipData = extractZipData(zipAttempt.data)

      if (zipAttempt.ok && zipData && zipData.cityCode) {
        const cityMatches = cityInput
          ? normalizeForCompare(zipData.city) === normalizeForCompare(cityInput)
          : true

        const stateMatches = stateInput
          ? normalizeForCompare(zipData.state) === normalizeForCompare(stateInput)
          : true

        return {
          ok: true as const,
          source: "zipcode",
          normalized: {
            city: zipData.city || cityInput,
            state: zipData.state || stateInput,
            country: zipData.country || country,
            postalCode: zipData.zipcode || postalCodeInput,
            cityCode: zipData.cityCode || "",
          },
          cityMatches,
          stateMatches,
          raw: zipAttempt.data,
          url: zipAttempt.url,
        }
      }
    } catch (error) {
      zipAttempt = {
        ok: false,
        status: 500,
        data: {
          error: error instanceof Error ? error.message : "zipcode lookup failed",
        },
        url: "",
      }
    }
  }

  if (cityInput) {
    try {
      cityAttempt = await locateCity({
        country,
        city: cityInput,
      })

      const options = extractCityOptions(cityAttempt.data)

      if (cityAttempt.ok && options.length > 0) {
        const selected = pickBestCityOption({
          options,
          cityInput,
          stateInput,
          postalCodeInput,
        })

        if (selected && selected.cityCode) {
          return {
            ok: true as const,
            source: "city",
            normalized: {
              city: selected.city || cityInput,
              state: selected.state || stateInput,
              country: selected.country || country,
              postalCode: selected.zipcode || postalCodeInput,
              cityCode: selected.cityCode || "",
            },
            options,
            raw: cityAttempt.data,
            url: cityAttempt.url,
          }
        }
      }
    } catch (error) {
      cityAttempt = {
        ok: false,
        status: 500,
        data: {
          error: error instanceof Error ? error.message : "city lookup failed",
        },
        url: "",
      }
    }
  }

  return {
    ok: false as const,
    error: "Envía no pudo validar la ciudad o el código postal.",
    stage: "zipcode_or_city",
    debug: {
      input: {
        city: cityInput,
        state: stateInput,
        postalCode: postalCodeInput,
        country,
      },
      zipcode: zipAttempt
        ? {
            ok: zipAttempt.ok,
            status: zipAttempt.status,
            url: zipAttempt.url,
            data: zipAttempt.data,
          }
        : null,
      city: cityAttempt
        ? {
            ok: cityAttempt.ok,
            status: cityAttempt.status,
            url: cityAttempt.url,
            data: cityAttempt.data,
          }
        : null,
    },
  }
}