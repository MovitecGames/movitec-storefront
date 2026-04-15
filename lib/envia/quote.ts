import { getEnviaConfig } from "./config"
import { findOfficialStateCode } from "./queries"
import { validateColombianAddress } from "./geocodes"

export type EnviaPackageInput = {
  type?: "box" | "envelope" | "pallet"
  content: string
  amount?: number
  declaredValue: number
  weight: number
  weightUnit?: "KG"
  lengthUnit?: "CM"
  dimensions: {
    length: number
    width: number
    height: number
  }
}

export type EnviaDestinationInput = {
  name: string
  company?: string
  email?: string
  phone: string
  street: string
  city: string
  state: string
  country: string
  postalCode: string
  cityCode?: string
}

export type QuoteShipmentInput = {
  carrier?: string
  destination: EnviaDestinationInput
  packages: EnviaPackageInput[]
}

type QuoteAttemptResult = {
  carrier: string
  ok: boolean
  status: number
  error?: string
  payload?: any
  response?: any
  services?: any[]
  addressValidation?: any
  destinationStateLookup?: any
  originStateLookup?: any
}

function cleanString(value: string) {
  return String(value || "").replace(/\s+/g, " ").trim()
}

function cleanPhone(value: string) {
  return cleanString(value).replace(/[^\d+]/g, "")
}

function limitString(value: string, max: number) {
  return cleanString(value).slice(0, max)
}

function optionalLimited(value: string | undefined, max: number) {
  const cleaned = cleanString(value || "")
  return cleaned ? cleaned.slice(0, max) : ""
}

function normalizeCountry(value: string) {
  return limitString(value || "CO", 2).toUpperCase()
}

function normalizePostalCode(value: string) {
  return cleanString(value).replace(/[^\d]/g, "").slice(0, 10)
}

function normalizeDigits(value: string) {
  return cleanString(value).replace(/[^\d]/g, "")
}

function ensurePositiveNumber(value: number, field: string) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`El campo ${field} debe ser un número mayor a 0`)
  }
}

function extractServicesFromCarrierResponse(raw: any, carrier: string) {
  const rows = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.data)
    ? raw.data
    : Array.isArray(raw?.rates)
    ? raw.rates
    : Array.isArray(raw?.options)
    ? raw.options
    : Array.isArray(raw?.quote)
    ? raw.quote
    : []

  return rows.map((row: any) => ({
    ...row,
    carrier: row?.carrier || carrier,
    carrierDescription:
      row?.carrierDescription || row?.carrier_description || carrier,
  }))
}

async function resolveOriginAddress() {
  const config = getEnviaConfig()

  const country = normalizeCountry(config.origin.country || "CO")
  const rawCity = cleanString(config.origin.city)
  const rawState = cleanString(config.origin.state)
  const rawPostalCode = normalizePostalCode(config.origin.postalCode)
  const rawCityCode = normalizeDigits(
    String(
      process.env.ENVIA_ORIGIN_CITY_CODE ||
        process.env.ENVIA_ORIGIN_MUNICIPALITY_CODE ||
        ""
    )
  )

  const stateResult = await findOfficialStateCode({
    country,
    stateName: rawState,
  })

  if (!stateResult.ok || !cleanString(stateResult.stateCode || "")) {
    return {
      ok: false as const,
      error:
        "No fue posible obtener el código oficial del departamento de origen para Envía.",
      stateLookup: stateResult,
    }
  }

  if (!rawCityCode) {
    return {
      ok: false as const,
      error:
        "No se encontró el código de municipio/ciudad de origen para Envía. Configura ENVIA_ORIGIN_CITY_CODE con el código oficial del municipio.",
      stateLookup: stateResult,
    }
  }

  return {
    ok: true as const,
    normalized: {
      name: limitString(config.origin.name, 60),
      company: limitString(config.origin.company, 60),
      phone: limitString(cleanPhone(config.origin.phone), 20),
      email: limitString(config.origin.email, 100),
      street: limitString(config.origin.street, 60),
      city: rawCityCode,
      state: cleanString(stateResult.stateCode),
      country,
      postalCode: rawPostalCode,
      cityCode: rawCityCode,
      rawCity,
    },
    stateLookup: stateResult,
  }
}

async function resolveDestinationAddress(input: EnviaDestinationInput) {
  const country = normalizeCountry(input.country || "CO")
  const rawCity = cleanString(input.city)
  const rawState = cleanString(input.state)
  const rawPostalCode = normalizePostalCode(input.postalCode)
  const rawCityCode = normalizeDigits(String(input.cityCode || ""))

  let validatedCity = rawCity
  let validatedState = rawState
  let validatedPostalCode = rawPostalCode
  let validatedCityCode = rawCityCode

  let addressValidation: Record<string, unknown> | null = null

  if (country === "CO") {
    const validation = await validateColombianAddress({
      city: rawCity,
      state: rawState,
      postalCode: rawPostalCode,
      country,
    })

    addressValidation = validation as Record<string, unknown>

    if (validation.ok) {
      validatedCity = cleanString(validation.normalized.city || rawCity)
      validatedState = cleanString(validation.normalized.state || rawState)
      validatedPostalCode = normalizePostalCode(
        validation.normalized.postalCode || rawPostalCode
      )
      validatedCityCode = normalizeDigits(
        String(validation.normalized.cityCode || rawCityCode)
      )
    }
  }

  const stateResult = await findOfficialStateCode({
    country,
    stateName: validatedState || rawState,
  })

  if (!stateResult.ok || !cleanString(stateResult.stateCode || "")) {
    return {
      ok: false as const,
      error:
        "No fue posible obtener el código oficial del departamento de destino para Envía.",
      addressValidation,
      stateLookup: stateResult,
    }
  }

  if (country === "CO" && !validatedCityCode) {
    return {
      ok: false as const,
      error:
        "No se encontró el código oficial del municipio o ciudad destino para Envía. Conserva el código postal real y envía también cityCode por separado.",
      addressValidation,
      stateLookup: stateResult,
    }
  }

  return {
    ok: true as const,
    normalized: {
      name: limitString(input.name, 60),
      company: optionalLimited(input.company, 60),
      email: optionalLimited(input.email, 100),
      phone: limitString(cleanPhone(input.phone), 20),
      street: limitString(input.street, 60),
      city: country === "CO" ? validatedCityCode : limitString(validatedCity, 40),
      state: cleanString(stateResult.stateCode),
      country,
      postalCode: validatedPostalCode,
      cityCode: validatedCityCode,
      rawCity: validatedCity,
      rawState: validatedState,
    },
    addressValidation,
    stateLookup: stateResult,
  }
}

async function parseJsonSafe(response: Response) {
  const text = await response.text()

  try {
    return text ? JSON.parse(text) : null
  } catch {
    return { raw: text }
  }
}

async function quoteSingleCarrier(params: {
  carrier: string
  packages: EnviaPackageInput[]
  originResolved: Awaited<ReturnType<typeof resolveOriginAddress>> & { ok: true }
  destinationResolved: Awaited<ReturnType<typeof resolveDestinationAddress>> & {
    ok: true
  }
}): Promise<QuoteAttemptResult> {
  const config = getEnviaConfig()

  const payload = {
    origin: {
      name: params.originResolved.normalized.name,
      company: params.originResolved.normalized.company,
      email: params.originResolved.normalized.email,
      phone: params.originResolved.normalized.phone,
      street: params.originResolved.normalized.street,
      city: params.originResolved.normalized.city,
      state: params.originResolved.normalized.state,
      country: params.originResolved.normalized.country,
      postalCode: params.originResolved.normalized.postalCode,
    },
    destination: {
      name: params.destinationResolved.normalized.name,
      company: params.destinationResolved.normalized.company,
      email: params.destinationResolved.normalized.email,
      phone: params.destinationResolved.normalized.phone,
      street: params.destinationResolved.normalized.street,
      city: params.destinationResolved.normalized.city,
      state: params.destinationResolved.normalized.state,
      country: params.destinationResolved.normalized.country,
      postalCode: params.destinationResolved.normalized.postalCode,
    },
    packages: params.packages.map((pkg) => ({
      type: pkg.type || "box",
      content: limitString(pkg.content, 60),
      amount: Number(pkg.amount || 1),
      declaredValue: Number(pkg.declaredValue),
      weight: Number(pkg.weight),
      weightUnit: pkg.weightUnit || "KG",
      lengthUnit: pkg.lengthUnit || "CM",
      dimensions: {
        length: Number(pkg.dimensions.length),
        width: Number(pkg.dimensions.width),
        height: Number(pkg.dimensions.height),
      },
    })),
    shipment: {
      type: 1,
      carrier: cleanString(params.carrier).toLowerCase(),
    },
  }

  try {
    const response = await fetch(`${config.baseUrl}/ship/rate/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    })

    const data = await parseJsonSafe(response)
    const services = extractServicesFromCarrierResponse(data, params.carrier)

    if (!response.ok) {
      return {
        carrier: params.carrier,
        ok: false,
        status: response.status,
        error: "Envía no devolvió una cotización válida.",
        payload,
        response: data,
        services: [],
        addressValidation: params.destinationResolved.addressValidation,
        destinationStateLookup: params.destinationResolved.stateLookup,
        originStateLookup: params.originResolved.stateLookup,
      }
    }

    if (!services.length) {
      return {
        carrier: params.carrier,
        ok: false,
        status: response.status,
        error: "Envía respondió pero no devolvió tarifas para esta transportadora.",
        payload,
        response: data,
        services: [],
        addressValidation: params.destinationResolved.addressValidation,
        destinationStateLookup: params.destinationResolved.stateLookup,
        originStateLookup: params.originResolved.stateLookup,
      }
    }

    return {
      carrier: params.carrier,
      ok: true,
      status: response.status,
      payload,
      response: data,
      services,
      addressValidation: params.destinationResolved.addressValidation,
      destinationStateLookup: params.destinationResolved.stateLookup,
      originStateLookup: params.originResolved.stateLookup,
    }
  } catch (error) {
    console.error("[ENVIA_QUOTE] unexpected error", error)

    return {
      carrier: params.carrier,
      ok: false,
      status: 500,
      error: "Ocurrió un error cotizando con Envía.",
      payload,
      response: null,
      services: [],
      addressValidation: params.destinationResolved.addressValidation,
      destinationStateLookup: params.destinationResolved.stateLookup,
      originStateLookup: params.originResolved.stateLookup,
    }
  }
}

export async function quoteWithEnvia(input: QuoteShipmentInput) {
  if (!input.packages.length) {
    throw new Error("Debes enviar al menos un paquete")
  }

  for (const [index, pkg] of input.packages.entries()) {
    ensurePositiveNumber(pkg.weight, `packages[${index}].weight`)
    ensurePositiveNumber(
      pkg.dimensions.length,
      `packages[${index}].dimensions.length`
    )
    ensurePositiveNumber(
      pkg.dimensions.width,
      `packages[${index}].dimensions.width`
    )
    ensurePositiveNumber(
      pkg.dimensions.height,
      `packages[${index}].dimensions.height`
    )
    ensurePositiveNumber(
      pkg.declaredValue,
      `packages[${index}].declaredValue`
    )
  }

  const originResolved = await resolveOriginAddress()

  if (!originResolved.ok) {
    return {
      ok: false as const,
      status: 400,
      error: originResolved.error,
      originStateLookup: originResolved.stateLookup,
    }
  }

  const destinationResolved = await resolveDestinationAddress(input.destination)

  if (!destinationResolved.ok) {
    return {
      ok: false as const,
      status: 400,
      error: destinationResolved.error,
      addressValidation: destinationResolved.addressValidation,
      destinationStateLookup: destinationResolved.stateLookup,
      originStateLookup: originResolved.stateLookup,
    }
  }

  const carriers = cleanString(input.carrier || "")
    ? [cleanString(input.carrier)]
    : ["servientrega", "interrapidisimo", "coordinadora", "deprisa", "tcc"]

  const attempts = await Promise.all(
    carriers.map((carrier) =>
      quoteSingleCarrier({
        carrier,
        packages: input.packages,
        originResolved,
        destinationResolved,
      })
    )
  )

  const quotes = attempts.filter((attempt) => attempt.ok)
  const failedQuotes = attempts.filter((attempt) => !attempt.ok)
  const consolidatedServices = quotes.flatMap((attempt) => attempt.services || [])

  if (!consolidatedServices.length) {
    const firstFailure = failedQuotes[0]

    return {
      ok: false as const,
      status: firstFailure?.status || 400,
      error:
        firstFailure?.error ||
        "No fue posible obtener cotizaciones válidas con las transportadoras disponibles.",
      response: [],
      quotes: [],
      failedQuotes,
      carriersTried: carriers,
      addressValidation: destinationResolved.addressValidation,
      destinationStateLookup: destinationResolved.stateLookup,
      originStateLookup: originResolved.stateLookup,
    }
  }

  return {
    ok: true as const,
    status: 200,
    response: consolidatedServices,
    quotes,
    failedQuotes,
    carriersTried: carriers,
    addressValidation: destinationResolved.addressValidation,
    destinationStateLookup: destinationResolved.stateLookup,
    originStateLookup: originResolved.stateLookup,
  }
}