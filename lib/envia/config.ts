type EnviaConfig = {
  apiToken: string
  baseUrl: string
  origin: {
    name: string
    company: string
    email: string
    phone: string
    street: string
    city: string
    state: string
    country: string
    postalCode: string
  }
}

function requireEnv(name: string) {
  const value = process.env[name]?.trim()

  if (!value) {
    throw new Error(`Falta la variable de entorno ${name}`)
  }

  return value
}

export function getEnviaConfig(): EnviaConfig {
  return {
    apiToken: requireEnv("ENVIA_API_TOKEN"),
    baseUrl: requireEnv("ENVIA_BASE_URL").replace(/\/+$/, ""),
    origin: {
      name: requireEnv("ENVIA_ORIGIN_NAME"),
      company: requireEnv("ENVIA_ORIGIN_COMPANY"),
      email: requireEnv("ENVIA_ORIGIN_EMAIL"),
      phone: requireEnv("ENVIA_ORIGIN_PHONE"),
      street: requireEnv("ENVIA_ORIGIN_STREET"),
      city: requireEnv("ENVIA_ORIGIN_CITY"),
      state: requireEnv("ENVIA_ORIGIN_STATE"),
      country: requireEnv("ENVIA_ORIGIN_COUNTRY"),
      postalCode: requireEnv("ENVIA_ORIGIN_POSTAL_CODE"),
    },
  }
}