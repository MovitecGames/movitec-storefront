"use client"

import Link from "next/link"
import { useEffect, useMemo, useState, type ChangeEvent } from "react"
import { useRouter } from "next/navigation"
import { medusa } from "../../lib/medusa"
import {
  retrieveCart,
  transferCart,
  updateCartAddresses,
  updateCartMetadata,
} from "../../lib/medusa-cart"
import { getStoredCartId } from "../../lib/cart-storage"
import { calculateCartPhysicalSummary } from "../../lib/shipping-utils"
import { calculateBogotaShipping } from "../../lib/bogota-distance-rate"
import {
  buildNationalShippingPayload,
  getNationalShippingPreviewText,
} from "../../lib/national-shipping"

type CartVariant = {
  metadata?: {
    weight_g?: string | number
    length_cm?: string | number
    width_cm?: string | number
    height_cm?: string | number
    [key: string]: any
  } | null
}

type CartLineItem = {
  id: string
  title?: string
  quantity?: number
  unit_price?: number
  metadata?: Record<string, any> | null
  variant?: CartVariant | null
}

type CartType = {
  id: string
  currency_code?: string
  email?: string
  items?: CartLineItem[]
  metadata?: Record<string, any> | null
}

type CustomerItem = {
  email?: string
  first_name?: string
  last_name?: string
  metadata?: {
    approved?: boolean
    [key: string]: any
  } | null
}

type DeliveryMode = "pickup" | "bogota" | "nacional"
type PaymentMethod = "breb" | "wompi"

type BogotaDistanceResponse = {
  ok: boolean
  distanceMeters: number
  distanceKm: number
  durationSeconds: number
  distanceText: string
  durationText: string
  destinationAddress: string
}

type CheckoutForm = {
  first_name: string
  last_name: string
  company: string
  nit: string
  phone: string
  email: string
  address_1: string
  city: string
  province: string
  postal_code: string
  country_code: string
  pickup_instructions: string
}

type NationalQuoteService = {
  service?: string
  carrier?: string
  carrierDescription?: string
  totalPrice?: number
  total_price?: number
  price?: number
  amount?: number
  cost?: number
  total?: number
  deliveryEstimate?: string | { [key: string]: any }
  deliveryDate?: string | { [key: string]: any }
  quantity?: number
  basePrice?: number
  base_price?: number
  totalTax?: number
  total_tax?: number
  insurance?: number
  currency?: string
  [key: string]: any
}

type QuoteAttempt = {
  carrier: string
  ok: boolean
  status: number
  error?: string
  payload?: any
  response?: any
  addressValidation?: any
  destinationStateLookup?: any
  originStateLookup?: any
}

type NationalQuoteResponse = {
  ok: boolean
  error?: string
  enviaStatus?: number
  payload?: any
  response?: any
  packingSummary?: any
  attempts?: any[]
  quotes?: QuoteAttempt[]
  failedQuotes?: QuoteAttempt[]
  carriersTried?: string[]
  [key: string]: any
}

type NationalAddressValidationResponse = {
  ok: boolean
  error?: string
  source?: string
  normalized?: {
    city?: string
    state?: string
    country?: string
    postalCode?: string
    cityCode?: string
  }
}

type FlattenedNationalService = NationalQuoteService & {
  sourceCarrier: string
  sourceQuoteIndex: number
  sourceServiceIndex: number
}

function normalizeWhitespace(value: string) {
  return String(value || "").replace(/\s+/g, " ").trim()
}

function normalizeBogotaAddress(address: string) {
  return normalizeWhitespace(address).replace(/\bNo\b\.?/gi, "#")
}

function normalizeBogotaCity(value: string) {
  const normalized = normalizeWhitespace(value).toLowerCase()

  if (!normalized) return "Bogotá"

  if (
    normalized === "bogota" ||
    normalized === "bogotá" ||
    normalized === "bogota d.c" ||
    normalized === "bogotá d.c" ||
    normalized === "bogota d.c." ||
    normalized === "bogotá d.c."
  ) {
    return "Bogotá"
  }

  return normalizeWhitespace(value)
}

function normalizeBogotaProvince(value: string) {
  const normalized = normalizeWhitespace(value).toLowerCase()

  if (!normalized) return "Bogotá D.C."

  if (
    normalized === "bogota" ||
    normalized === "bogotá" ||
    normalized === "bogota d.c" ||
    normalized === "bogotá d.c" ||
    normalized === "bogota d.c." ||
    normalized === "bogotá d.c."
  ) {
    return "Bogotá D.C."
  }

  return normalizeWhitespace(value)
}

function normalizeTextForCompare(value: string) {
  return normalizeWhitespace(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\./g, "")
    .toUpperCase()
}

function isBogotaAddress(city: string, province: string) {
  const normalizedCity = normalizeTextForCompare(city)
  const normalizedProvince = normalizeTextForCompare(province)

  const cityIsBogota =
    normalizedCity === "BOGOTA" ||
    normalizedCity === "BOGOTA DC" ||
    normalizedCity === "BOGOTA D C"

  const provinceIsBogota =
    normalizedProvince === "BOGOTA" ||
    normalizedProvince === "BOGOTA DC" ||
    normalizedProvince === "BOGOTA D C"

  return cityIsBogota || provinceIsBogota
}

function toTitleCase(value: string) {
  return normalizeWhitespace(value)
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function normalizeCarrierLabel(value: string) {
  const normalized = normalizeTextForCompare(value)

  if (normalized === "SERVIENTREGA") return "Servientrega"
  if (normalized === "INTERRAPIDISIMO") return "Inter Rapidísimo"
  if (normalized === "COORDINADORA") return "Coordinadora"
  if (normalized === "DEPRISA") return "Deprisa"
  if (normalized === "TCC") return "TCC"
  if (normalized === "ENVIA") return "Envía"

  return toTitleCase(value)
}

function normalizeServiceLabel(value: string) {
  const normalized = normalizeTextForCompare(value)

  if (normalized === "PREMIER") return "Premier"
  if (normalized === "INDUSTRIAL") return "Industrial"
  if (normalized === "EXPRESS") return "Express"
  if (normalized === "SAME DAY") return "Same Day"

  return toTitleCase(value)
}

function getReadableNationalServiceName(service: {
  carrier?: string
  carrierDescription?: string
  service?: string
  sourceCarrier?: string
}) {
  const carrierRaw =
    service.sourceCarrier || service.carrier || service.carrierDescription || "Envía"

  const carrier = normalizeCarrierLabel(String(carrierRaw))
  const rawService = String(service.service || "").trim()
  const normalizedService = normalizeServiceLabel(rawService)

  if (!normalizedService) return carrier

  return `${carrier} ${normalizedService}`.trim()
}

function getItemWeightGrams(item: CartLineItem) {
  const variantWeight = item.variant?.metadata?.weight_g
  const metadataWeight = item.metadata?.weight_g
  const raw = variantWeight ?? metadataWeight ?? 0
  const parsed = Number(raw)

  return Number.isFinite(parsed) ? parsed : 0
}

function getItemDimensions(item: CartLineItem) {
  const metadata = item.variant?.metadata || item.metadata || {}

  const length = Number(metadata.length_cm ?? 0)
  const width = Number(metadata.width_cm ?? 0)
  const height = Number(metadata.height_cm ?? 0)

  return {
    length_cm: Number.isFinite(length) ? length : 0,
    width_cm: Number.isFinite(width) ? width : 0,
    height_cm: Number.isFinite(height) ? height : 0,
  }
}

function buildCartItemsForEnvia(items: CartLineItem[]) {
  return items.map((item, index) => {
    const dimensions = getItemDimensions(item)

    return {
      sku: item.id || `ITEM-${index + 1}`,
      name: item.title || `Producto ${index + 1}`,
      quantity: Number(item.quantity || 0),
      weight_g: getItemWeightGrams(item),
      length_cm: dimensions.length_cm,
      width_cm: dimensions.width_cm,
      height_cm: dimensions.height_cm,
      unit_price: Number(item.unit_price || 0),
      can_rotate: true,
      ships_alone: false,
    }
  })
}

function getDeclaredValue(items: CartLineItem[]) {
  return items.reduce((acc, item) => {
    const quantity = Number(item.quantity || 0)
    const unitPrice = Number(item.unit_price || 0)
    return acc + quantity * unitPrice
  }, 0)
}

function extractNationalServices(rawResponse: any): NationalQuoteService[] {
  if (!rawResponse) return []

  if (Array.isArray(rawResponse)) return rawResponse
  if (Array.isArray(rawResponse.data)) return rawResponse.data
  if (Array.isArray(rawResponse.rates)) return rawResponse.rates
  if (Array.isArray(rawResponse.options)) return rawResponse.options
  if (Array.isArray(rawResponse.quote)) return rawResponse.quote

  return []
}

function flattenQuoteServices(
  quotes: QuoteAttempt[] | undefined
): FlattenedNationalService[] {
  if (!Array.isArray(quotes)) return []

  const result: FlattenedNationalService[] = []

  quotes.forEach((quote, quoteIndex) => {
    if (!quote?.ok) return

    const services = extractNationalServices(quote.response)

    services.forEach((service, serviceIndex) => {
      result.push({
        ...service,
        sourceCarrier: normalizeWhitespace(quote.carrier),
        sourceQuoteIndex: quoteIndex,
        sourceServiceIndex: serviceIndex,
      })
    })
  })

  return result
}

function getNationalServicePrice(service: NationalQuoteService) {
  const candidates = [
    service.totalPrice,
    service.total_price,
    service.price,
    service.amount,
    service.cost,
    service.total,
  ]

  for (const candidate of candidates) {
    const parsed = Number(candidate)
    if (Number.isFinite(parsed) && parsed >= 0) return parsed
  }

  return 0
}

function getNationalServiceBasePrice(service: NationalQuoteService) {
  const candidates = [service.basePrice, service.base_price]

  for (const candidate of candidates) {
    const parsed = Number(candidate)
    if (Number.isFinite(parsed) && parsed >= 0) return parsed
  }

  return 0
}

function getNationalServiceTax(service: NationalQuoteService) {
  const candidates = [service.totalTax, service.total_tax]

  for (const candidate of candidates) {
    const parsed = Number(candidate)
    if (Number.isFinite(parsed) && parsed >= 0) return parsed
  }

  return 0
}

function getNationalServiceInsurance(service: NationalQuoteService) {
  const parsed = Number(service.insurance)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0
}

function sortNationalServices(services: FlattenedNationalService[]) {
  return [...services].sort(
    (a, b) => getNationalServicePrice(a) - getNationalServicePrice(b)
  )
}

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value)
}

function getSafeNumber(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function formatEstimate(value: unknown) {
  if (!value) return ""

  if (typeof value === "string" || typeof value === "number") {
    return String(value)
  }

  if (typeof value === "object") {
    const obj = value as Record<string, unknown>
    const date = obj.date ? String(obj.date) : ""
    const time = obj.time ? String(obj.time) : ""
    const diff = obj.dateDifference ? String(obj.dateDifference) : ""

    return [date, time, diff].filter(Boolean).join(" · ")
  }

  return ""
}

function getServiceStableKey(service: FlattenedNationalService) {
  return [
    normalizeCarrierLabel(String(service.sourceCarrier || service.carrier || "")),
    normalizeServiceLabel(String(service.service || "")),
    String(getNationalServicePrice(service)),
    String(service.sourceQuoteIndex),
    String(service.sourceServiceIndex),
  ].join("|")
}

function generateCheckoutOrderNumber(existing?: string) {
  const normalizedExisting = normalizeWhitespace(existing || "")
  if (normalizedExisting) return normalizedExisting

  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  const hours = String(now.getHours()).padStart(2, "0")
  const minutes = String(now.getMinutes()).padStart(2, "0")
  const seconds = String(now.getSeconds()).padStart(2, "0")
  const random = Math.floor(100 + Math.random() * 900)

  return `MV-${year}${month}${day}-${hours}${minutes}${seconds}-${random}`
}

export default function CheckoutPage() {
  const router = useRouter()

  const [cart, setCart] = useState<CartType | null>(null)
  const [customer, setCustomer] = useState<CustomerItem | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("breb")
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>("pickup")
  const [loading, setLoading] = useState(true)
  const [savingAddress, setSavingAddress] = useState(false)
  const [addressSaved, setAddressSaved] = useState(false)
  const [submittingCheckout, setSubmittingCheckout] = useState(false)

  const [calculatingBogota, setCalculatingBogota] = useState(false)
  const [bogotaDistanceKm, setBogotaDistanceKm] = useState<number | null>(null)
  const [bogotaDistanceText, setBogotaDistanceText] = useState("")
  const [bogotaDurationText, setBogotaDurationText] = useState("")
  const [bogotaError, setBogotaError] = useState("")

  const [quotingNational, setQuotingNational] = useState(false)
  const [nationalQuoteError, setNationalQuoteError] = useState("")
  const [nationalQuoteResponse, setNationalQuoteResponse] =
    useState<NationalQuoteResponse | null>(null)
  const [selectedNationalServiceKey, setSelectedNationalServiceKey] =
    useState<string>("")

  const [validatingNationalAddress, setValidatingNationalAddress] =
    useState(false)
  const [nationalAddressError, setNationalAddressError] = useState("")
  const [nationalAddressValidated, setNationalAddressValidated] =
    useState(false)
  const [nationalCityCode, setNationalCityCode] = useState("")

  const [orderConfirmed, setOrderConfirmed] = useState(false)

  const [form, setForm] = useState<CheckoutForm>({
    first_name: "",
    last_name: "",
    company: "",
    nit: "",
    phone: "",
    email: "",
    address_1: "",
    city: "",
    province: "Bogotá D.C.",
    postal_code: "",
    country_code: "co",
    pickup_instructions: "",
  })

  const loadCheckoutData = async () => {
    try {
      const cartId = getStoredCartId()

      if (!cartId) {
        setCart(null)
        return
      }

      const { customer } = await medusa.store.customer
        .retrieve()
        .catch(() => ({ customer: null }))

      setCustomer(customer)

      if (customer) {
        await transferCart(cartId).catch(() => null)
      }

      const { cart } = await retrieveCart(cartId)
      setCart(cart as CartType)

      const cartMetadata = (cart as any)?.metadata || {}

      setForm((prev) => ({
        ...prev,
        email: customer?.email || cart.email || prev.email,
        pickup_instructions: String(cartMetadata.pickup_instructions || ""),
      }))

      if (cartMetadata.delivery_mode === "pickup") {
        setDeliveryMode("pickup")
      } else if (cartMetadata.delivery_mode === "bogota") {
        setDeliveryMode("bogota")
      } else if (cartMetadata.delivery_mode === "nacional") {
        setDeliveryMode("nacional")
      }

      if (cartMetadata.payment_method === "breb") {
        setPaymentMethod("breb")
      } else if (cartMetadata.payment_method === "wompi") {
        setPaymentMethod("wompi")
      }

      setOrderConfirmed(Boolean(cartMetadata.checkout_review_confirmed))
    } catch (error) {
      console.error(error)
      setCart(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCheckoutData()
  }, [])

  const getLineSubtotal = (item: CartLineItem) => {
    return (item.unit_price || 0) * (item.quantity || 0)
  }

  const items = cart?.items || []
  const currency = cart?.currency_code?.toUpperCase() || "COP"
  const cartMetadata = cart?.metadata || {}

  const totalPvp = useMemo(() => {
    return items.reduce((acc, item) => acc + getLineSubtotal(item), 0)
  }, [items])

  const declaredValue = useMemo(() => {
    return getDeclaredValue(items)
  }, [items])

  const cartPhysicalSummary = useMemo(() => {
    return calculateCartPhysicalSummary(items)
  }, [items])

  const commercialTerms = useMemo(() => {
    if (totalPvp >= 4000000) {
      return { rate: 0.38, label: "Condición comercial 38%" }
    }
    if (totalPvp >= 2000000) {
      return { rate: 0.35, label: "Condición comercial 35%" }
    }
    if (totalPvp >= 800000) {
      return { rate: 0.32, label: "Condición comercial 32%" }
    }
    return { rate: 0, label: "Sin condición comercial por volumen" }
  }, [totalPvp])

  const commercialValue = totalPvp * commercialTerms.rate
  const totalWithCommercialTerms = totalPvp - commercialValue

  const retefuenteValue = useMemo(() => {
    return getSafeNumber(
      cartMetadata.checkout_retefuente_value ??
        cartMetadata.retefuente_value ??
        0
    )
  }, [cartMetadata])

  const icaValue = useMemo(() => {
    return getSafeNumber(
      cartMetadata.checkout_ica_value ?? cartMetadata.ica_value ?? 0
    )
  }, [cartMetadata])

  const bogotaShipping = useMemo(() => {
    if (deliveryMode !== "bogota" || bogotaDistanceKm === null) return null

    return calculateBogotaShipping({
      distanceKm: bogotaDistanceKm,
      weightKg: cartPhysicalSummary.totalWeightKg,
    })
  }, [deliveryMode, bogotaDistanceKm, cartPhysicalSummary.totalWeightKg])

  const nationalPayload = useMemo(() => {
    if (deliveryMode !== "nacional") return null

    return buildNationalShippingPayload({
      destinationCity: form.city,
      destinationState: form.province,
      destinationPostalCode: form.postal_code,
      weightKg: cartPhysicalSummary.totalWeightKg,
      declaredValue,
    })
  }, [
    deliveryMode,
    form.city,
    form.province,
    form.postal_code,
    cartPhysicalSummary.totalWeightKg,
    declaredValue,
  ])

  const nationalServices = useMemo(() => {
    const services = sortNationalServices(
      flattenQuoteServices(nationalQuoteResponse?.quotes)
    )

    if (!services.length) return services

    const savedCarrier = normalizeWhitespace(
      String(cartMetadata.selected_shipping_carrier || "")
    )
    const savedService = normalizeWhitespace(
      String(cartMetadata.selected_shipping_service || "")
    )
    const savedPrice = Number(cartMetadata.selected_shipping_price || 0)

    if (!savedCarrier && !savedService && !(savedPrice > 0)) {
      return services
    }

    const matched = services.find((service) => {
      const carrierMatches =
        normalizeWhitespace(
          String(service.sourceCarrier || service.carrier || "")
        ) === savedCarrier
      const serviceMatches =
        normalizeWhitespace(String(service.service || "")) === savedService
      const priceMatches = getNationalServicePrice(service) === savedPrice

      return carrierMatches && serviceMatches && priceMatches
    })

    if (!matched) return services

    return [matched, ...services.filter((item) => item !== matched)]
  }, [nationalQuoteResponse, cartMetadata])

  const bestNationalService = useMemo(() => {
    if (!nationalServices.length) return null

    if (selectedNationalServiceKey) {
      return (
        nationalServices.find(
          (service) => getServiceStableKey(service) === selectedNationalServiceKey
        ) || nationalServices[0]
      )
    }

    return nationalServices[0]
  }, [nationalServices, selectedNationalServiceKey])

  const shippingCost = useMemo(() => {
    if (deliveryMode === "pickup") return 0
    if (deliveryMode === "bogota") return bogotaShipping?.finalPrice || 0
    if (deliveryMode === "nacional") {
      return bestNationalService ? getNationalServicePrice(bestNationalService) : 0
    }
    return 0
  }, [deliveryMode, bogotaShipping, bestNationalService])

  const totalBeforePayment = totalWithCommercialTerms + shippingCost
  const wompiFee = paymentMethod === "wompi" ? totalBeforePayment * 0.03 : 0
  const finalCheckoutTotal =
    totalWithCommercialTerms + shippingCost - retefuenteValue - icaValue + wompiFee

  const canContinueToPayment =
    (deliveryMode === "pickup" ||
      (deliveryMode === "bogota" && !!bogotaShipping) ||
      (deliveryMode === "nacional" && !!bestNationalService)) &&
    orderConfirmed

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const resetDeliveryState = () => {
    setAddressSaved(false)
    setOrderConfirmed(false)

    setBogotaDistanceKm(null)
    setBogotaDistanceText("")
    setBogotaDurationText("")
    setBogotaError("")
    setCalculatingBogota(false)

    setQuotingNational(false)
    setNationalQuoteError("")
    setNationalQuoteResponse(null)
    setSelectedNationalServiceKey("")

    setValidatingNationalAddress(false)
    setNationalAddressError("")
    setNationalAddressValidated(false)
    setNationalCityCode("")
  }

  const handleValidateNationalAddress = async () => {
    try {
      const postalCode = normalizeWhitespace(form.postal_code)

      if (!postalCode) {
        setNationalAddressValidated(false)
        setNationalAddressError("Debes ingresar el código postal.")
        return
      }

      setValidatingNationalAddress(true)
      setNationalAddressError("")
      setNationalAddressValidated(false)
      setNationalCityCode("")

      const response = await fetch("/api/envia/validate-address", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          postalCode,
          city: normalizeWhitespace(form.city),
          state: normalizeWhitespace(form.province),
          country: "CO",
        }),
      })

      const data =
        (await response.json().catch(() => null)) as NationalAddressValidationResponse | null

      if (!response.ok || !data?.ok || !data.normalized) {
        setNationalAddressValidated(false)
        setNationalAddressError(
          data?.error || "No fue posible validar el código postal."
        )
        return
      }

      const normalizedCity = normalizeWhitespace(data.normalized.city || "")
      const normalizedState = normalizeWhitespace(data.normalized.state || "")
      const normalizedPostalCode = normalizeWhitespace(
        data.normalized.postalCode || postalCode
      )

      setForm((prev) => ({
        ...prev,
        city: normalizedCity,
        province: normalizedState,
        postal_code: normalizedPostalCode,
        country_code: "co",
      }))

      setNationalCityCode(normalizeWhitespace(data.normalized.cityCode || ""))
      setNationalAddressValidated(true)
      setNationalAddressError("")
    } catch (error) {
      console.error(error)
      setNationalAddressValidated(false)
      setNationalAddressError("Ocurrió un error validando la dirección nacional.")
    } finally {
      setValidatingNationalAddress(false)
    }
  }

  const handleSaveAddress = async () => {
    try {
      const cartId = getStoredCartId()

      if (!cartId) {
        alert("No se encontró un carrito activo.")
        return
      }

      if (!form.first_name || !form.last_name || !form.email) {
        alert("Completa al menos nombre, apellido y correo.")
        return
      }

      if (deliveryMode !== "pickup") {
        if (!form.address_1 || !form.city) {
          alert("Completa la dirección y ciudad para el envío.")
          return
        }
      }

      if (deliveryMode === "nacional") {
        if (!form.postal_code) {
          alert("Para envío nacional debes indicar el código postal.")
          return
        }

        if (!nationalAddressValidated || !nationalCityCode) {
          alert("Primero valida el código postal del envío nacional.")
          return
        }
      }

      setSavingAddress(true)

      const shippingCity =
        deliveryMode === "pickup"
          ? "Bogotá"
          : deliveryMode === "bogota"
          ? normalizeBogotaCity(form.city)
          : normalizeWhitespace(form.city)

      const shippingProvince =
        deliveryMode === "pickup"
          ? "Bogotá D.C."
          : deliveryMode === "bogota"
          ? normalizeBogotaProvince(form.province)
          : normalizeWhitespace(form.province)

      const shippingAddress1 =
        deliveryMode === "pickup"
          ? "Recoger en bodega"
          : deliveryMode === "bogota"
          ? normalizeBogotaAddress(form.address_1)
          : normalizeWhitespace(form.address_1)

      await updateCartAddresses(cartId, {
        email: form.email,
        shipping_address: {
          first_name: normalizeWhitespace(form.first_name),
          last_name: normalizeWhitespace(form.last_name),
          company: normalizeWhitespace(form.company),
          address_1: shippingAddress1,
          city: shippingCity,
          province: shippingProvince,
          postal_code: normalizeWhitespace(form.postal_code),
          country_code: form.country_code,
          phone: normalizeWhitespace(form.phone),
        },
        billing_address: {
          first_name: normalizeWhitespace(form.first_name),
          last_name: normalizeWhitespace(form.last_name),
          company: normalizeWhitespace(form.company),
          address_1: shippingAddress1,
          city: shippingCity,
          province: shippingProvince,
          postal_code: normalizeWhitespace(form.postal_code),
          country_code: form.country_code,
          phone: normalizeWhitespace(form.phone),
        },
        metadata: {
          ...cartMetadata,
          delivery_mode: deliveryMode,
          pickup_instructions:
            deliveryMode === "pickup"
              ? normalizeWhitespace(form.pickup_instructions)
              : "",
          selected_shipping_carrier:
            deliveryMode === "nacional" && bestNationalService
              ? normalizeWhitespace(
                  String(
                    bestNationalService.sourceCarrier ||
                      bestNationalService.carrier ||
                      ""
                  )
                )
              : "",
          selected_shipping_service:
            deliveryMode === "nacional" && bestNationalService
              ? normalizeWhitespace(String(bestNationalService.service || ""))
              : "",
          selected_shipping_label:
            deliveryMode === "nacional" && bestNationalService
              ? getReadableNationalServiceName(bestNationalService)
              : "",
          selected_shipping_price:
            deliveryMode === "nacional" && bestNationalService
              ? getNationalServicePrice(bestNationalService)
              : 0,
          payment_method: paymentMethod,
          checkout_retefuente_value: retefuenteValue,
          checkout_ica_value: icaValue,
          checkout_review_confirmed: false,
        },
      })

      setForm((prev) => ({
        ...prev,
        address_1:
          deliveryMode === "bogota"
            ? normalizeBogotaAddress(prev.address_1)
            : normalizeWhitespace(prev.address_1),
        city: deliveryMode === "bogota" ? shippingCity : normalizeWhitespace(prev.city),
        province:
          deliveryMode === "bogota"
            ? shippingProvince
            : normalizeWhitespace(prev.province),
        postal_code: normalizeWhitespace(prev.postal_code),
        first_name: normalizeWhitespace(prev.first_name),
        last_name: normalizeWhitespace(prev.last_name),
        company: normalizeWhitespace(prev.company),
        phone: normalizeWhitespace(prev.phone),
        pickup_instructions: normalizeWhitespace(prev.pickup_instructions),
      }))

      setAddressSaved(true)
      setOrderConfirmed(false)

      if (deliveryMode === "nacional" && isBogotaAddress(shippingCity, shippingProvince)) {
        alert(
          "La dirección corresponde a Bogotá. Para esta ciudad usa la modalidad 'Entrega en Bogotá' y no 'Envío nacional'."
        )
        return
      }

      alert("Datos del pedido guardados correctamente.")
    } catch (error) {
      console.error(error)
      alert("No fue posible guardar la información del pedido.")
    } finally {
      setSavingAddress(false)
    }
  }

  const handleCalculateBogotaShipping = async () => {
    try {
      if (!form.address_1 || !form.city) {
        alert("Completa la dirección y la ciudad para calcular el envío.")
        return
      }

      setCalculatingBogota(true)
      setBogotaError("")
      setBogotaDistanceKm(null)
      setBogotaDistanceText("")
      setBogotaDurationText("")
      setOrderConfirmed(false)

      const normalizedAddress = normalizeBogotaAddress(form.address_1)
      const fullAddress = `${normalizedAddress}, Bogotá, Colombia`

      const response = await fetch("/api/bogota-distance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          address: fullAddress,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        const errorMessage =
          typeof data === "object" && data !== null && "error" in data
            ? (data as { error?: string }).error ||
              "No fue posible calcular la distancia."
            : "No fue posible calcular la distancia."

        setBogotaError(errorMessage)
        return
      }

      const okData = data as BogotaDistanceResponse

      setBogotaDistanceKm(okData.distanceKm)
      setBogotaDistanceText(okData.distanceText)
      setBogotaDurationText(okData.durationText)
    } catch (error) {
      console.error(error)
      setBogotaError("Ocurrió un error calculando la tarifa Bogotá.")
    } finally {
      setCalculatingBogota(false)
    }
  }

  const handleQuoteNationalShipping = async () => {
    try {
      if (!addressSaved) {
        alert("Primero guarda los datos del pedido.")
        return
      }

      if (!form.address_1 || !form.city || !form.province || !form.postal_code) {
        alert(
          "Completa dirección, ciudad, departamento y código postal para cotizar el envío nacional."
        )
        return
      }

      if (!nationalAddressValidated || !nationalCityCode) {
        alert("Primero valida el código postal.")
        return
      }

      if (isBogotaAddress(form.city, form.province)) {
        alert(
          "Para Bogotá debes usar la modalidad 'Entrega en Bogotá', no 'Envío nacional'."
        )
        return
      }

      setQuotingNational(true)
      setNationalQuoteError("")
      setNationalQuoteResponse(null)
      setSelectedNationalServiceKey("")
      setOrderConfirmed(false)

      const payload = {
        destination: {
          name: `${normalizeWhitespace(form.first_name)} ${normalizeWhitespace(
            form.last_name
          )}`.trim(),
          company: normalizeWhitespace(form.company),
          email: normalizeWhitespace(form.email),
          phone: normalizeWhitespace(form.phone),
          street: normalizeWhitespace(form.address_1),
          city: normalizeWhitespace(form.city),
          state: normalizeWhitespace(form.province),
          country: normalizeWhitespace(form.country_code || "co").toUpperCase(),
          postalCode: normalizeWhitespace(form.postal_code),
          cityCode: nationalCityCode,
        },
        cartItems: buildCartItemsForEnvia(items),
      }

      const response = await fetch("/api/envia/quote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      const data = (await response.json()) as NationalQuoteResponse
      setNationalQuoteResponse(data)

      if (!response.ok || !data.ok) {
        setNationalQuoteError(
          data.error || "No fue posible obtener la cotización nacional."
        )
        return
      }

      const services = sortNationalServices(flattenQuoteServices(data.quotes))

      if (!services.length) {
        setNationalQuoteError(
          "Envía respondió, pero no devolvió servicios cotizables para esta dirección."
        )
        return
      }

      const savedCarrier = normalizeWhitespace(
        String(cartMetadata.selected_shipping_carrier || "")
      )
      const savedService = normalizeWhitespace(
        String(cartMetadata.selected_shipping_service || "")
      )
      const savedPrice = Number(cartMetadata.selected_shipping_price || 0)

      const matchedSavedService = services.find((service) => {
        const carrierMatches =
          normalizeWhitespace(String(service.sourceCarrier || service.carrier || "")) ===
          savedCarrier
        const serviceMatches =
          normalizeWhitespace(String(service.service || "")) === savedService
        const priceMatches = getNationalServicePrice(service) === savedPrice

        return carrierMatches && serviceMatches && priceMatches
      })

      setSelectedNationalServiceKey(
        getServiceStableKey(matchedSavedService || services[0])
      )
    } catch (error) {
      console.error(error)
      setNationalQuoteError("Ocurrió un error cotizando el envío nacional.")
    } finally {
      setQuotingNational(false)
    }
  }

  const handleSelectPaymentMethod = async (method: PaymentMethod) => {
    setPaymentMethod(method)
    setOrderConfirmed(false)

    const cartId = getStoredCartId()
    if (!cartId) return

    try {
      await updateCartAddresses(cartId, {
        metadata: {
          ...cartMetadata,
          payment_method: method,
          delivery_mode: deliveryMode,
          pickup_instructions:
            deliveryMode === "pickup"
              ? normalizeWhitespace(form.pickup_instructions)
              : "",
          selected_shipping_carrier:
            deliveryMode === "nacional" && bestNationalService
              ? normalizeWhitespace(
                  String(
                    bestNationalService.sourceCarrier ||
                      bestNationalService.carrier ||
                      ""
                  )
                )
              : "",
          selected_shipping_service:
            deliveryMode === "nacional" && bestNationalService
              ? normalizeWhitespace(String(bestNationalService.service || ""))
              : "",
          selected_shipping_label:
            deliveryMode === "nacional" && bestNationalService
              ? getReadableNationalServiceName(bestNationalService)
              : "",
          selected_shipping_price:
            deliveryMode === "nacional" && bestNationalService
              ? getNationalServicePrice(bestNationalService)
              : 0,
          checkout_retefuente_value: retefuenteValue,
          checkout_ica_value: icaValue,
          checkout_review_confirmed: false,
        },
      })
    } catch (error) {
      console.error("[CHECKOUT_PAYMENT_METHOD_SAVE] unexpected error", error)
    }
  }

  const handleContinueToPayment = async () => {
    const cartId = getStoredCartId()

    if (!cartId) {
      alert("No se encontró un carrito activo.")
      return
    }

    if (!canContinueToPayment) {
      alert("Debes confirmar primero el resumen final del pedido.")
      return
    }

    try {
      setSubmittingCheckout(true)

      const orderNumber = generateCheckoutOrderNumber(
        String(cartMetadata.checkout_order_number || "")
      )

      await updateCartMetadata(cartId, {
        checkout_order_number: orderNumber,
        delivery_mode: deliveryMode,
        payment_method: paymentMethod,
        pickup_instructions:
          deliveryMode === "pickup"
            ? normalizeWhitespace(form.pickup_instructions)
            : "",
        selected_shipping_carrier:
          deliveryMode === "nacional" && bestNationalService
            ? normalizeWhitespace(
                String(
                  bestNationalService.sourceCarrier ||
                    bestNationalService.carrier ||
                    ""
                )
              )
            : "",
        selected_shipping_service:
          deliveryMode === "nacional" && bestNationalService
            ? normalizeWhitespace(String(bestNationalService.service || ""))
            : "",
        selected_shipping_label:
          deliveryMode === "nacional" && bestNationalService
            ? getReadableNationalServiceName(bestNationalService)
            : "",
        selected_shipping_price:
          deliveryMode === "nacional" && bestNationalService
            ? getNationalServicePrice(bestNationalService)
            : deliveryMode === "bogota" && bogotaShipping
            ? bogotaShipping.finalPrice
            : 0,
        checkout_review_confirmed: true,
        checkout_confirmed_at: new Date().toISOString(),
        checkout_total_pvp: totalPvp,
        checkout_commercial_label: commercialTerms.label,
        checkout_commercial_value: commercialValue,
        checkout_total_with_commercial_terms: totalWithCommercialTerms,
        checkout_shipping_cost: shippingCost,
        checkout_payment_fee: wompiFee,
        checkout_retefuente_value: retefuenteValue,
        checkout_ica_value: icaValue,
        checkout_final_total: finalCheckoutTotal,
      })

      if (paymentMethod === "breb") {
        router.push("/checkout/confirmacion")
        return
      }

      alert("El flujo de Wompi será el siguiente paso. Por ahora deja Bre-B como método funcional.")
    } catch (error) {
      console.error("[CHECKOUT_CONTINUE_TO_PAYMENT] unexpected error", error)
      alert("No fue posible continuar al pago.")
    } finally {
      setSubmittingCheckout(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-neutral-50 text-slate-900">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <p className="text-sm text-slate-500">Cargando checkout…</p>
        </div>
      </main>
    )
  }

  if (!cart || !items.length) {
    return (
      <main className="min-h-screen bg-neutral-50 text-slate-900">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <h1 className="text-3xl font-bold">Checkout</h1>
          <p className="mt-3 text-slate-600">
            No hay un carrito activo para continuar.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white"
          >
            Volver al catálogo
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-neutral-50 text-slate-900">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-6 flex items-center justify-between gap-4">
          <Link
            href="/carrito"
            className="text-sm font-medium text-slate-500 hover:text-slate-900"
          >
            ← Volver al carrito
          </Link>
        </div>

        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
            Checkout B2B
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            Dirección, entrega y pago
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            Guarda los datos del pedido, selecciona la modalidad de entrega y
            define el método de pago para continuar con el cierre de la orden.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.35fr_0.9fr]">
          <div className="space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                Paso 1
              </p>
              <h2 className="mt-2 text-xl font-bold tracking-tight">
                Modalidad de entrega
              </h2>

              <div className="mt-4 space-y-3">
                <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 p-4 hover:bg-slate-50">
                  <input
                    type="radio"
                    name="deliveryMode"
                    checked={deliveryMode === "pickup"}
                    onChange={() => {
                      setDeliveryMode("pickup")
                      resetDeliveryState()
                    }}
                    className="mt-1"
                  />
                  <div>
                    <p className="font-semibold text-slate-900">
                      Recoger en bodega
                    </p>
                    <p className="text-sm text-slate-500">
                      Sin costo. La entrega se coordina una vez se verifique el pago.
                    </p>
                  </div>
                </label>

                <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 p-4 hover:bg-slate-50">
                  <input
                    type="radio"
                    name="deliveryMode"
                    checked={deliveryMode === "bogota"}
                    onChange={() => {
                      setDeliveryMode("bogota")
                      resetDeliveryState()
                    }}
                    className="mt-1"
                  />
                  <div>
                    <p className="font-semibold text-slate-900">
                      Entrega en Bogotá
                    </p>
                    <p className="text-sm text-slate-500">
                      Tarifa calculada por kilómetros recorridos y peso total del pedido.
                    </p>
                  </div>
                </label>

                <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 p-4 hover:bg-slate-50">
                  <input
                    type="radio"
                    name="deliveryMode"
                    checked={deliveryMode === "nacional"}
                    onChange={() => {
                      setDeliveryMode("nacional")
                      resetDeliveryState()
                      setForm((prev) => ({
                        ...prev,
                        city: "",
                        province: "",
                        postal_code: "",
                        address_1: "",
                      }))
                    }}
                    className="mt-1"
                  />
                  <div>
                    <p className="font-semibold text-slate-900">
                      Envío nacional
                    </p>
                    <p className="text-sm text-slate-500">
                      Cotización automática con Envía según dirección, peso y volumen del pedido.
                    </p>
                  </div>
                </label>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                Paso 2
              </p>
              <h2 className="mt-2 text-xl font-bold tracking-tight">
                Datos del pedido
              </h2>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <input
                  name="first_name"
                  value={form.first_name}
                  onChange={handleChange}
                  placeholder="Nombre *"
                  className="rounded-xl border border-slate-300 px-4 py-3"
                />
                <input
                  name="last_name"
                  value={form.last_name}
                  onChange={handleChange}
                  placeholder="Apellido *"
                  className="rounded-xl border border-slate-300 px-4 py-3"
                />
                <input
                  name="company"
                  value={form.company}
                  onChange={handleChange}
                  placeholder="Empresa"
                  className="rounded-xl border border-slate-300 px-4 py-3"
                />
                <input
                  name="nit"
                  value={form.nit}
                  onChange={handleChange}
                  placeholder="NIT"
                  className="rounded-xl border border-slate-300 px-4 py-3"
                />
                <input
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Correo *"
                  className="rounded-xl border border-slate-300 px-4 py-3"
                />
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="Teléfono"
                  className="rounded-xl border border-slate-300 px-4 py-3"
                />

                {deliveryMode !== "pickup" && (
                  <>
                    <input
                      name="address_1"
                      value={form.address_1}
                      onChange={handleChange}
                      placeholder="Dirección *"
                      className="rounded-xl border border-slate-300 px-4 py-3 md:col-span-2"
                    />

                    {deliveryMode === "bogota" ? (
                      <>
                        <input
                          name="city"
                          value={form.city}
                          onChange={handleChange}
                          placeholder="Ciudad *"
                          className="rounded-xl border border-slate-300 px-4 py-3"
                        />
                        <input
                          name="province"
                          value={form.province}
                          onChange={handleChange}
                          placeholder="Departamento"
                          className="rounded-xl border border-slate-300 px-4 py-3"
                        />
                        <input
                          name="postal_code"
                          value={form.postal_code}
                          onChange={handleChange}
                          placeholder="Código postal"
                          className="rounded-xl border border-slate-300 px-4 py-3"
                        />
                      </>
                    ) : (
                      <>
                        <div className="md:col-span-2 grid gap-3 md:grid-cols-[1fr_auto]">
                          <input
                            name="postal_code"
                            value={form.postal_code}
                            onChange={(e) => {
                              handleChange(e)
                              setNationalAddressValidated(false)
                              setNationalAddressError("")
                              setNationalCityCode("")
                              setNationalQuoteResponse(null)
                              setSelectedNationalServiceKey("")
                              setOrderConfirmed(false)
                            }}
                            placeholder="Código postal *"
                            className="rounded-xl border border-slate-300 px-4 py-3"
                          />
                          <button
                            type="button"
                            onClick={handleValidateNationalAddress}
                            disabled={validatingNationalAddress}
                            className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
                          >
                            {validatingNationalAddress ? "Validando..." : "Validar código postal"}
                          </button>
                        </div>

                        <div className="md:col-span-2 -mt-1">
                          <a
                            href="https://visor.codigopostal.gov.co/472/visor/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-slate-600 underline underline-offset-4 hover:text-slate-900"
                          >
                            ¿No tienes claro tu código postal? Acá lo puedes encontrar.
                          </a>
                        </div>

                        <input
                          name="city"
                          value={form.city}
                          readOnly
                          placeholder="Ciudad"
                          className="rounded-xl border border-slate-300 bg-slate-100 px-4 py-3"
                        />

                        <input
                          name="province"
                          value={form.province}
                          readOnly
                          placeholder="Departamento"
                          className="rounded-xl border border-slate-300 bg-slate-100 px-4 py-3"
                        />

                        {nationalCityCode && (
                          <div className="md:col-span-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                            Código oficial de ciudad detectado: <strong>{nationalCityCode}</strong>
                          </div>
                        )}

                        {nationalAddressError && (
                          <div className="md:col-span-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {nationalAddressError}
                          </div>
                        )}

                        {nationalAddressValidated && !nationalAddressError && (
                          <div className="md:col-span-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                            Código postal validado correctamente. Ciudad y departamento completados automáticamente.
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}

                {deliveryMode === "pickup" && (
                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Instrucciones para recoger en bodega
                    </label>
                    <textarea
                      name="pickup_instructions"
                      value={form.pickup_instructions}
                      onChange={(e) => {
                        handleChange(e)
                        setOrderConfirmed(false)
                      }}
                      placeholder="Ejemplo: nombre de quien recoge, horario estimado o instrucciones de coordinación."
                      rows={4}
                      className="w-full rounded-xl border border-slate-300 px-4 py-3"
                    />
                    <p className="mt-2 text-xs text-slate-500">
                      Este campo es informativo para coordinar la entrega de la mercancía.
                    </p>
                  </div>
                )}
              </div>

              <button
                onClick={handleSaveAddress}
                disabled={savingAddress}
                className="mt-5 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                {savingAddress ? "Guardando..." : "Guardar datos"}
              </button>
            </section>

            {deliveryMode === "bogota" && (
              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Paso 3
                </p>
                <h2 className="mt-2 text-xl font-bold tracking-tight">
                  Cálculo de tarifa Bogotá
                </h2>

                {!addressSaved ? (
                  <p className="mt-4 text-sm text-slate-500">
                    Primero guarda los datos del pedido para calcular la distancia.
                  </p>
                ) : (
                  <>
                    <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                      <p className="font-semibold text-slate-900">
                        Fórmula aplicada
                      </p>
                      <p className="mt-2">
                        Tarifa = (kilómetros × tarifa por km) + (peso × tarifa por kg)
                      </p>
                    </div>

                    <button
                      onClick={handleCalculateBogotaShipping}
                      disabled={calculatingBogota}
                      className="mt-5 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
                    >
                      {calculatingBogota
                        ? "Calculando distancia..."
                        : "Calcular tarifa Bogotá"}
                    </button>

                    {bogotaError && (
                      <div className="mt-4 rounded-2xl bg-red-50 p-4 text-sm text-red-700">
                        {bogotaError}
                      </div>
                    )}

                    {bogotaDistanceKm !== null && bogotaShipping && (
                      <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
                          Resultado de la tarifa
                        </p>

                        <div className="mt-4 grid gap-3 text-sm text-slate-700">
                          <div className="flex items-center justify-between">
                            <span>Distancia estimada</span>
                            <span className="font-medium">
                              {bogotaDistanceText ||
                                `${bogotaDistanceKm.toFixed(2)} km`}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span>Tiempo estimado</span>
                            <span className="font-medium">
                              {bogotaDurationText || "No disponible"}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span>Peso total del pedido</span>
                            <span className="font-medium">
                              {cartPhysicalSummary.totalWeightKg.toFixed(2)} kg
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span>Cobro por kilómetros</span>
                            <span className="font-medium">
                              {formatMoney(bogotaShipping.distanceCost, currency)}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span>Cobro por peso</span>
                            <span className="font-medium">
                              {formatMoney(bogotaShipping.weightCost, currency)}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span>Tarifa mínima aplicada</span>
                            <span className="font-medium">
                              {formatMoney(bogotaShipping.minPrice, currency)}
                            </span>
                          </div>

                          <div className="border-t border-emerald-200 pt-3">
                            <div className="flex items-center justify-between text-base font-bold text-slate-900">
                              <span>Tarifa final Bogotá</span>
                              <span>
                                {formatMoney(bogotaShipping.finalPrice, currency)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </section>
            )}

            {deliveryMode === "nacional" && (
              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Paso 3
                </p>
                <h2 className="mt-2 text-xl font-bold tracking-tight">
                  Cotización nacional con Envía
                </h2>

                {!addressSaved ? (
                  <p className="mt-4 text-sm text-slate-500">
                    Primero guarda los datos del pedido para cotizar el envío nacional.
                  </p>
                ) : (
                  <>
                    <div className="mt-4 rounded-2xl bg-slate-50 p-5 text-sm text-slate-700">
                      <p className="font-semibold text-slate-900">
                        Base de cotización
                      </p>

                      {nationalPayload && (
                        <p className="mt-2 text-slate-600">
                          {getNationalShippingPreviewText(nationalPayload)}
                        </p>
                      )}

                      <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <div className="rounded-xl bg-white p-4">
                          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                            Valor declarado mercancía
                          </p>
                          <p className="mt-1 text-lg font-bold text-slate-900">
                            {formatMoney(declaredValue, currency)}
                          </p>
                        </div>

                        <div className="rounded-xl bg-white p-4">
                          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                            Peso total
                          </p>
                          <p className="mt-1 text-lg font-bold text-slate-900">
                            {cartPhysicalSummary.totalWeightKg.toFixed(2)} kg
                          </p>
                        </div>

                        <div className="rounded-xl bg-white p-4 md:col-span-2">
                          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                            Destino
                          </p>
                          <p className="mt-1 text-sm font-medium text-slate-900">
                            {normalizeWhitespace(form.city)},{" "}
                            {normalizeWhitespace(form.province)} ·{" "}
                            {normalizeWhitespace(form.postal_code)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleQuoteNationalShipping}
                      disabled={quotingNational}
                      className="mt-5 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
                    >
                      {quotingNational
                        ? "Cotizando con Envía..."
                        : "Cotizar envío nacional"}
                    </button>

                    {nationalQuoteError && (
                      <div className="mt-4 rounded-2xl bg-red-50 p-4 text-sm text-red-700">
                        <p>{nationalQuoteError}</p>
                        <p className="mt-2 font-medium">
                          Si no es posible cotizar el envío nacional, escoge “Recoger en bodega” y coordina el envío posterior al pago.
                        </p>
                      </div>
                    )}

                    {!!nationalServices.length && (
                      <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
                          Servicios disponibles
                        </p>

                        <div className="mt-4 space-y-3">
                          {nationalServices.map((service) => {
                            const serviceName =
                              getReadableNationalServiceName(service) ||
                              "Servicio"

                            const price = getNationalServicePrice(service)
                            const basePrice = getNationalServiceBasePrice(service)
                            const tax = getNationalServiceTax(service)
                            const insurance = getNationalServiceInsurance(service)
                            const estimate = formatEstimate(service.deliveryEstimate)
                            const deliveryDate = formatEstimate(service.deliveryDate)

                            const serviceKey = getServiceStableKey(service)
                            const isSelected =
                              selectedNationalServiceKey === serviceKey ||
                              (!selectedNationalServiceKey &&
                                service === nationalServices[0])

                            return (
                              <label
                                key={serviceKey}
                                className="flex cursor-pointer items-start gap-3 rounded-2xl border border-emerald-200 bg-white p-4"
                              >
                                <input
                                  type="radio"
                                  name="nationalService"
                                  checked={isSelected}
                                  onChange={() => {
                                    setSelectedNationalServiceKey(serviceKey)
                                    setOrderConfirmed(false)
                                  }}
                                  className="mt-1"
                                />
                                <div className="w-full">
                                  <div className="flex items-start justify-between gap-4">
                                    <div>
                                      <p className="font-semibold text-slate-900">
                                        {serviceName}
                                      </p>
                                      <p className="text-sm text-slate-500">
                                        {normalizeCarrierLabel(
                                          String(service.sourceCarrier || service.carrier || "Envía")
                                        )}
                                      </p>
                                    </div>

                                    <p className="text-sm font-bold text-slate-900">
                                      {formatMoney(price, currency)}
                                    </p>
                                  </div>

                                  <div className="mt-3 grid gap-2 text-sm text-slate-600 md:grid-cols-2">
                                    {estimate && (
                                      <p>Entrega estimada: {estimate}</p>
                                    )}
                                    {deliveryDate && (
                                      <p>Fecha estimada: {deliveryDate}</p>
                                    )}
                                    <p>Base: {formatMoney(basePrice, currency)}</p>
                                    <p>Impuestos: {formatMoney(tax, currency)}</p>
                                    <p>Seguro: {formatMoney(insurance, currency)}</p>
                                    <p>Moneda: {service.currency || currency}</p>
                                  </div>
                                </div>
                              </label>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </section>
            )}

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                Paso 4
              </p>
              <h2 className="mt-2 text-xl font-bold tracking-tight">
                Método de pago
              </h2>

              <div className="mt-4 space-y-3">
                <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 p-4 hover:bg-slate-50">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="breb"
                    checked={paymentMethod === "breb"}
                    onChange={() => handleSelectPaymentMethod("breb")}
                    className="mt-1"
                  />
                  <div>
                    <p className="font-semibold text-slate-900">
                      Bre-B / transferencia directa
                    </p>
                    <p className="text-sm text-slate-500">
                      Sin costo adicional. El cliente tendrá 24 horas para enviar el soporte de pago al correo comercial. El despacho inicia una vez el pago esté reflejado.
                    </p>
                  </div>
                </label>

                <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 p-4 hover:bg-slate-50">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="wompi"
                    checked={paymentMethod === "wompi"}
                    onChange={() => handleSelectPaymentMethod("wompi")}
                    className="mt-1"
                  />
                  <div>
                    <p className="font-semibold text-slate-900">
                      Wompi / pasarela digital
                    </p>
                    <p className="text-sm text-slate-500">
                      Incremento del 3% sobre el valor final de la orden.
                    </p>
                  </div>
                </label>
              </div>

              <div className="mt-5 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">
                El inventario se actualiza en tiempo real. Las unidades solo quedan separadas una vez se confirma la forma de pago.
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                Paso 5
              </p>
              <h2 className="mt-2 text-xl font-bold tracking-tight">
                Confirmación final del pedido
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Revisa cuidadosamente los productos, la entrega, los datos del pedido y el valor total antes de continuar al pago.
              </p>

              <div className="mt-6 space-y-6">
                <div className="rounded-2xl border border-slate-200 p-5">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Productos
                  </h3>

                  <div className="mt-4 space-y-3">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-xl bg-slate-50 p-4"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-semibold text-slate-900">
                              {item.title || "Producto"}
                            </p>
                            <p className="mt-1 text-sm text-slate-600">
                              Cantidad: {item.quantity || 0}
                            </p>
                            <p className="text-sm text-slate-600">
                              Precio unitario: {formatMoney(Number(item.unit_price || 0), currency)}
                            </p>
                          </div>

                          <p className="text-sm font-bold text-slate-900">
                            {formatMoney(getLineSubtotal(item), currency)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 p-5">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Datos del cliente
                  </h3>

                  <div className="mt-4 grid gap-3 text-sm text-slate-700 md:grid-cols-2">
                    <div>
                      <span className="font-medium text-slate-900">Nombre:</span>{" "}
                      {form.first_name} {form.last_name}
                    </div>
                    <div>
                      <span className="font-medium text-slate-900">Empresa:</span>{" "}
                      {form.company || "No registrada"}
                    </div>
                    <div>
                      <span className="font-medium text-slate-900">NIT:</span>{" "}
                      {form.nit || "No registrado"}
                    </div>
                    <div>
                      <span className="font-medium text-slate-900">Correo:</span>{" "}
                      {form.email || "No registrado"}
                    </div>
                    <div className="md:col-span-2">
                      <span className="font-medium text-slate-900">Teléfono:</span>{" "}
                      {form.phone || "No registrado"}
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 p-5">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Entrega
                  </h3>

                  <div className="mt-4 space-y-3 text-sm text-slate-700">
                    <p>
                      <span className="font-medium text-slate-900">Modalidad:</span>{" "}
                      {deliveryMode === "pickup"
                        ? "Recoger en bodega"
                        : deliveryMode === "bogota"
                        ? "Entrega en Bogotá"
                        : "Envío nacional"}
                    </p>

                    {deliveryMode === "pickup" && (
                      <>
                        <p>
                          <span className="font-medium text-slate-900">Costo de entrega:</span>{" "}
                          {formatMoney(0, currency)}
                        </p>
                        <p>
                          <span className="font-medium text-slate-900">Instrucciones:</span>{" "}
                          {form.pickup_instructions || "Sin instrucciones adicionales"}
                        </p>
                      </>
                    )}

                    {deliveryMode === "bogota" && (
                      <>
                        <p>
                          <span className="font-medium text-slate-900">Dirección:</span>{" "}
                          {form.address_1 || "No registrada"}
                        </p>
                        <p>
                          <span className="font-medium text-slate-900">Ciudad:</span>{" "}
                          {form.city || "No registrada"}
                        </p>
                        <p>
                          <span className="font-medium text-slate-900">Departamento:</span>{" "}
                          {form.province || "No registrado"}
                        </p>
                        <p>
                          <span className="font-medium text-slate-900">Código postal:</span>{" "}
                          {form.postal_code || "No registrado"}
                        </p>
                        <p>
                          <span className="font-medium text-slate-900">Valor envío:</span>{" "}
                          {bogotaShipping
                            ? formatMoney(bogotaShipping.finalPrice, currency)
                            : "Pendiente cálculo"}
                        </p>
                      </>
                    )}

                    {deliveryMode === "nacional" && (
                      <>
                        <p>
                          <span className="font-medium text-slate-900">Dirección:</span>{" "}
                          {form.address_1 || "No registrada"}
                        </p>
                        <p>
                          <span className="font-medium text-slate-900">Ciudad:</span>{" "}
                          {form.city || "No registrada"}
                        </p>
                        <p>
                          <span className="font-medium text-slate-900">Departamento:</span>{" "}
                          {form.province || "No registrado"}
                        </p>
                        <p>
                          <span className="font-medium text-slate-900">Código postal:</span>{" "}
                          {form.postal_code || "No registrado"}
                        </p>
                        <p>
                          <span className="font-medium text-slate-900">Transportadora / servicio:</span>{" "}
                          {bestNationalService
                            ? getReadableNationalServiceName(bestNationalService)
                            : "Pendiente selección"}
                        </p>
                        <p>
                          <span className="font-medium text-slate-900">Valor envío:</span>{" "}
                          {bestNationalService
                            ? formatMoney(getNationalServicePrice(bestNationalService), currency)
                            : "Pendiente cotización"}
                        </p>
                      </>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 p-5">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Método de pago
                  </h3>

                  <div className="mt-4 space-y-3 text-sm text-slate-700">
                    <p>
                      <span className="font-medium text-slate-900">Forma de pago:</span>{" "}
                      {paymentMethod === "wompi"
                        ? "Wompi / pasarela digital"
                        : "Bre-B / transferencia directa"}
                    </p>
                    <p>
                      <span className="font-medium text-slate-900">Costo adicional por pago:</span>{" "}
                      {formatMoney(wompiFee, currency)}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 p-5">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Resumen económico final
                  </h3>

                  <div className="mt-4 space-y-3 text-sm text-slate-700">
                    <div className="flex items-center justify-between">
                      <span>Total PVP</span>
                      <span>{formatMoney(totalPvp, currency)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>{commercialTerms.label}</span>
                      <span>- {formatMoney(commercialValue, currency)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Total con condición comercial</span>
                      <span>{formatMoney(totalWithCommercialTerms, currency)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Envío</span>
                      <span>{formatMoney(shippingCost, currency)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Retefuente</span>
                      <span>- {formatMoney(retefuenteValue, currency)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>ICA</span>
                      <span>- {formatMoney(icaValue, currency)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Costo adicional por pago</span>
                      <span>{formatMoney(wompiFee, currency)}</span>
                    </div>
                    <div className="border-t border-slate-200 pt-3 flex items-center justify-between text-base font-bold text-slate-900">
                      <span>Total a pagar</span>
                      <span>{formatMoney(finalCheckoutTotal, currency)}</span>
                    </div>
                  </div>
                </div>

                <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <input
                    type="checkbox"
                    checked={orderConfirmed}
                    onChange={async (e) => {
                      const checked = e.target.checked
                      setOrderConfirmed(checked)

                      const cartId = getStoredCartId()
                      if (!cartId) return

                      try {
                        await updateCartMetadata(cartId, {
                          checkout_review_confirmed: checked,
                        })
                      } catch (error) {
                        console.error("[CHECKOUT_CONFIRM_REVIEW] unexpected error", error)
                      }
                    }}
                    className="mt-1"
                  />
                  <div className="text-sm text-slate-700">
                    <p className="font-medium text-slate-900">
                      Confirmación final
                    </p>
                    <p className="mt-1">
                      Confirmo que revisé los productos, la entrega, la dirección, el método de pago y el valor final del pedido.
                    </p>
                  </div>
                </label>
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold">Resumen checkout</h2>

              <div className="mt-5 space-y-3 text-sm">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Total PVP</span>
                  <span>{formatMoney(totalPvp, currency)}</span>
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <span>{commercialTerms.label}</span>
                  <span>- {formatMoney(commercialValue, currency)}</span>
                </div>

                <div className="flex items-center justify-between font-semibold text-slate-900">
                  <span>Total con condición comercial</span>
                  <span>{formatMoney(totalWithCommercialTerms, currency)}</span>
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <span>Entrega</span>
                  <span>
                    {deliveryMode === "pickup"
                      ? "Recoger en bodega"
                      : deliveryMode === "bogota"
                      ? "Bogotá"
                      : "Nacional"}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <span>Envío</span>
                  <span>
                    {deliveryMode === "nacional" && !bestNationalService
                      ? "Pendiente cotización"
                      : formatMoney(shippingCost, currency)}
                  </span>
                </div>

                {deliveryMode === "nacional" && bestNationalService && (
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Servicio seleccionado</span>
                    <span className="text-right">
                      {getReadableNationalServiceName(bestNationalService)}
                    </span>
                  </div>
                )}

                {deliveryMode === "pickup" && form.pickup_instructions && (
                  <div className="flex items-start justify-between gap-4 text-slate-600">
                    <span>Instrucciones</span>
                    <span className="max-w-[60%] text-right">
                      {form.pickup_instructions}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between text-slate-600">
                  <span>Método de pago</span>
                  <span>{paymentMethod === "wompi" ? "Wompi" : "Bre-B"}</span>
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <span>Costo adicional por pago</span>
                  <span>{formatMoney(wompiFee, currency)}</span>
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <span>Retefuente</span>
                  <span>- {formatMoney(retefuenteValue, currency)}</span>
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <span>ICA</span>
                  <span>- {formatMoney(icaValue, currency)}</span>
                </div>

                <hr className="my-2 border-slate-200" />

                <div className="flex items-center justify-between text-slate-600">
                  <span>Valor declarado</span>
                  <span>{formatMoney(declaredValue, currency)}</span>
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <span>Peso total</span>
                  <span>{cartPhysicalSummary.totalWeightGrams} g</span>
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <span>Peso total convertido</span>
                  <span>{cartPhysicalSummary.totalWeightKg.toFixed(2)} kg</span>
                </div>

                <div className="flex items-center justify-between text-lg font-bold text-slate-900">
                  <span>Total a pagar</span>
                  <span>{formatMoney(finalCheckoutTotal, currency)}</span>
                </div>
              </div>

              <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-xs leading-6 text-slate-500">
                {deliveryMode === "pickup"
                  ? "La recogida se coordina una vez se verifique el pago."
                  : deliveryMode === "bogota"
                  ? "La tarifa Bogotá se calcula con tu logística local y no depende de Envía."
                  : bestNationalService
                  ? "La logística nacional ya fue cotizada con varias transportadoras y el valor del servicio seleccionado ya está incluido en el total."
                  : "La logística nacional requiere cotización con Envía antes de continuar."}
              </div>

              <div className="mt-4 rounded-2xl bg-amber-50 p-4 text-xs leading-6 text-amber-900">
                El inventario está en tiempo real y las unidades solo se separan cuando se confirma la forma de pago.
              </div>

              <button
                onClick={handleContinueToPayment}
                disabled={!canContinueToPayment || submittingCheckout}
                className="mt-6 w-full rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                {submittingCheckout
                  ? "Procesando..."
                  : paymentMethod === "breb"
                  ? "Continuar a instrucciones de pago"
                  : "Continuar al pago"}
              </button>
            </section>
          </aside>
        </div>
      </div>
    </main>
  )
}