"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { medusa } from "../../lib/medusa"
import {
  addShippingMethod,
  listCartShippingOptions,
  retrieveCart,
  transferCart,
  updateCartAddresses,
} from "../../lib/medusa-cart"
import { getStoredCartId } from "../../lib/cart-storage"

type CartLineItem = {
  id: string
  title?: string
  quantity?: number
  unit_price?: number
}

type CartType = {
  id: string
  currency_code?: string
  email?: string
  items?: CartLineItem[]
  shipping_methods?: {
    id: string
    amount?: number
    name?: string
  }[]
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

type ShippingOption = {
  id: string
  name?: string
  price_type?: string
  amount?: number
}

type DeliveryMode = "pickup" | "bogota" | "nacional"
type PaymentMethod = "breb" | "wompi"

export default function CheckoutPage() {
  const [cart, setCart] = useState<CartType | null>(null)
  const [customer, setCustomer] = useState<CustomerItem | null>(null)
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([])
  const [selectedShippingOption, setSelectedShippingOption] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("breb")
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>("pickup")
  const [loading, setLoading] = useState(true)
  const [savingAddress, setSavingAddress] = useState(false)
  const [savingShipping, setSavingShipping] = useState(false)
  const [addressSaved, setAddressSaved] = useState(false)

  const [form, setForm] = useState({
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

      setForm((prev) => ({
        ...prev,
        email: customer?.email || cart.email || prev.email,
      }))
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

  const totalPvp = useMemo(() => {
    return items.reduce((acc, item) => acc + getLineSubtotal(item), 0)
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

  const pickupCost = 0

  const selectedShippingCost = useMemo(() => {
    if (deliveryMode === "pickup") return pickupCost
    const found = shippingOptions.find((opt) => opt.id === selectedShippingOption)
    return found?.amount || 0
  }, [shippingOptions, selectedShippingOption, deliveryMode])

  const totalBeforePayment = totalWithCommercialTerms + selectedShippingCost
  const wompiFee = paymentMethod === "wompi" ? totalBeforePayment * 0.03 : 0
  const finalCheckoutTotal = totalBeforePayment + wompiFee

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const filterShippingOptions = (
    options: ShippingOption[],
    mode: DeliveryMode
  ) => {
    if (mode === "bogota") {
      return options.filter((opt) => {
        const name = (opt.name || "").toLowerCase()
        return name.includes("bog") || name.includes("bogotá")
      })
    }

    if (mode === "nacional") {
      return options.filter((opt) => {
        const name = (opt.name || "").toLowerCase()
        return !name.includes("bog") && !name.includes("bogotá")
      })
    }

    return []
  }

  const resetShippingSelection = () => {
    setSelectedShippingOption("")
    setShippingOptions([])
    setAddressSaved(false)
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

      setSavingAddress(true)
      setSelectedShippingOption("")
      setShippingOptions([])

      await updateCartAddresses(cartId, {
        email: form.email,
        shipping_address: {
          first_name: form.first_name,
          last_name: form.last_name,
          company: form.company,
          address_1: deliveryMode === "pickup" ? "Recoger en bodega" : form.address_1,
          city: deliveryMode === "pickup" ? "Bogotá" : form.city,
          province: form.province,
          postal_code: form.postal_code,
          country_code: form.country_code,
          phone: form.phone,
        },
        billing_address: {
          first_name: form.first_name,
          last_name: form.last_name,
          company: form.company,
          address_1: deliveryMode === "pickup" ? "Recoger en bodega" : form.address_1,
          city: deliveryMode === "pickup" ? "Bogotá" : form.city,
          province: form.province,
          postal_code: form.postal_code,
          country_code: form.country_code,
          phone: form.phone,
        },
      })

      if (deliveryMode === "pickup") {
        setAddressSaved(true)
        alert("Datos guardados. La modalidad de recogida no requiere envío.")
        return
      }

      const cartOptionsResponse = await listCartShippingOptions(cartId)
      const rawOptions = (cartOptionsResponse as any)?.shipping_options || []
      const filtered = filterShippingOptions(rawOptions, deliveryMode)

      setShippingOptions(filtered)
      setAddressSaved(true)
      alert("Datos guardados correctamente.")
    } catch (error) {
      console.error(error)
      alert("No fue posible guardar la información del pedido.")
    } finally {
      setSavingAddress(false)
    }
  }

  const handleSaveShipping = async () => {
    try {
      if (deliveryMode === "pickup") {
        alert("La recogida en bodega no requiere método de envío.")
        return
      }

      const cartId = getStoredCartId()

      if (!cartId) {
        alert("No se encontró un carrito activo.")
        return
      }

      if (!selectedShippingOption) {
        alert("Selecciona un método de envío.")
        return
      }

      setSavingShipping(true)

      await addShippingMethod(cartId, selectedShippingOption)

      const { cart } = await retrieveCart(cartId)
      setCart(cart as CartType)

      alert("Método de envío guardado.")
    } catch (error) {
      console.error(error)
      alert("No fue posible guardar el método de envío.")
    } finally {
      setSavingShipping(false)
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
                      resetShippingSelection()
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
                      resetShippingSelection()
                    }}
                    className="mt-1"
                  />
                  <div>
                    <p className="font-semibold text-slate-900">
                      Entrega en Bogotá
                    </p>
                    <p className="text-sm text-slate-500">
                      Una vez se verifique el pago, la entrega se programa para
                      el día siguiente en la mañana.
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
                      resetShippingSelection()
                    }}
                    className="mt-1"
                  />
                  <div>
                    <p className="font-semibold text-slate-900">
                      Envío nacional
                    </p>
                    <p className="text-sm text-slate-500">
                      Preparado para conectar transportadora según peso y volumen.
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

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                Paso 3
              </p>
              <h2 className="mt-2 text-xl font-bold tracking-tight">
                Método de envío
              </h2>

              {deliveryMode === "pickup" ? (
                <div className="mt-4 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-900">
                  La recogida en bodega no requiere costo de envío. Una vez se
                  confirme el pago, se coordinará la entrega.
                </div>
              ) : !addressSaved ? (
                <p className="mt-4 text-sm text-slate-500">
                  Primero guarda los datos del pedido para cargar las opciones de envío.
                </p>
              ) : shippingOptions.length === 0 ? (
                <p className="mt-4 text-sm text-slate-500">
                  No hay opciones de envío disponibles para esta modalidad. Luego
                  conectaremos la lógica tarifaria real.
                </p>
              ) : (
                <>
                  <div className="mt-4 space-y-3">
                    {shippingOptions.map((option) => (
                      <label
                        key={option.id}
                        className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 p-4 hover:bg-slate-50"
                      >
                        <input
                          type="radio"
                          name="shippingOption"
                          value={option.id}
                          checked={selectedShippingOption === option.id}
                          onChange={() => setSelectedShippingOption(option.id)}
                          className="mt-1"
                        />
                        <div>
                          <p className="font-semibold text-slate-900">
                            {option.name || "Opción de envío"}
                          </p>
                          <p className="text-sm text-slate-500">
                            {new Intl.NumberFormat("es-CO", {
                              style: "currency",
                              currency,
                              maximumFractionDigits: 0,
                            }).format(option.amount || 0)}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>

                  <button
                    onClick={handleSaveShipping}
                    disabled={savingShipping || !selectedShippingOption}
                    className="mt-5 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {savingShipping ? "Guardando..." : "Guardar método de envío"}
                  </button>
                </>
              )}
            </section>

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
                    onChange={() => setPaymentMethod("breb")}
                    className="mt-1"
                  />
                  <div>
                    <p className="font-semibold text-slate-900">
                      Bre-B / transferencia directa
                    </p>
                    <p className="text-sm text-slate-500">
                      Sin costo adicional. El cliente tendrá 24 horas para enviar
                      el soporte de pago al correo comercial. El despacho inicia
                      una vez el pago esté reflejado.
                    </p>
                  </div>
                </label>

                <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 p-4 hover:bg-slate-50">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="wompi"
                    checked={paymentMethod === "wompi"}
                    onChange={() => setPaymentMethod("wompi")}
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
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold">Resumen checkout</h2>

              <div className="mt-5 space-y-3 text-sm">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Total PVP</span>
                  <span>
                    {new Intl.NumberFormat("es-CO", {
                      style: "currency",
                      currency,
                      maximumFractionDigits: 0,
                    }).format(totalPvp)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <span>{commercialTerms.label}</span>
                  <span>
                    -{" "}
                    {new Intl.NumberFormat("es-CO", {
                      style: "currency",
                      currency,
                      maximumFractionDigits: 0,
                    }).format(commercialValue)}
                  </span>
                </div>

                <div className="flex items-center justify-between font-semibold text-slate-900">
                  <span>Total con condición comercial</span>
                  <span>
                    {new Intl.NumberFormat("es-CO", {
                      style: "currency",
                      currency,
                      maximumFractionDigits: 0,
                    }).format(totalWithCommercialTerms)}
                  </span>
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
                    {new Intl.NumberFormat("es-CO", {
                      style: "currency",
                      currency,
                      maximumFractionDigits: 0,
                    }).format(selectedShippingCost)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <span>Costo adicional por pago</span>
                  <span>
                    {new Intl.NumberFormat("es-CO", {
                      style: "currency",
                      currency,
                      maximumFractionDigits: 0,
                    }).format(wompiFee)}
                  </span>
                </div>

                <hr className="my-2 border-slate-200" />

                <div className="flex items-center justify-between text-lg font-bold text-slate-900">
                  <span>Total a pagar</span>
                  <span>
                    {new Intl.NumberFormat("es-CO", {
                      style: "currency",
                      currency,
                      maximumFractionDigits: 0,
                    }).format(finalCheckoutTotal)}
                  </span>
                </div>
              </div>

              <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-xs leading-6 text-slate-500">
                {deliveryMode === "pickup"
                  ? "La recogida se coordina una vez se verifique el pago."
                  : deliveryMode === "bogota"
                  ? "Para entregas en Bogotá, una vez se verifique el pago, la entrega se programa para el día siguiente en la mañana."
                  : "Para envíos nacionales, en la siguiente fase conectaremos la plataforma de transportadora con peso y volumen."}
              </div>

              <button
                disabled
                className="mt-6 w-full rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white opacity-60"
              >
                Continuar al pago próximamente
              </button>
            </section>
          </aside>
        </div>
      </div>
    </main>
  )
}