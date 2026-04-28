"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"

const STORES_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTGoL3IJp7qP7scrVwo3aeXNpJ9viLL2dPQViNUzgR6M4BGwGzL7aadnZ2HNCfJMqTXWZVQenFZagdD/pub?gid=0&single=true&output=csv"

type StoreLocation = {
  activo: string
  nombre: string
  ciudad: string
  departamento: string
  direccion: string
  telefono: string
  whatsapp: string
  instagram: string
  web: string
  maps: string
  tipo: string
  orden: string
}

function normalizeText(value: unknown) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
}

function parseCsvRows(csv: string) {
  const rows: string[][] = []
  let currentRow: string[] = []
  let currentValue = ""
  let insideQuotes = false

  for (let index = 0; index < csv.length; index++) {
    const char = csv[index]
    const nextChar = csv[index + 1]

    if (char === '"' && insideQuotes && nextChar === '"') {
      currentValue += '"'
      index++
      continue
    }

    if (char === '"') {
      insideQuotes = !insideQuotes
      continue
    }

    if (char === "," && !insideQuotes) {
      currentRow.push(currentValue)
      currentValue = ""
      continue
    }

    if ((char === "\n" || char === "\r") && !insideQuotes) {
      if (char === "\r" && nextChar === "\n") {
        index++
      }

      currentRow.push(currentValue)
      rows.push(currentRow)

      currentRow = []
      currentValue = ""
      continue
    }

    currentValue += char
  }

  if (currentValue || currentRow.length) {
    currentRow.push(currentValue)
    rows.push(currentRow)
  }

  return rows
}

function parseStoresCsv(csv: string): StoreLocation[] {
  const rows = parseCsvRows(csv.trim())

  if (!rows.length) return []

  const headers = rows[0].map((header) =>
    normalizeText(header.replace(/^\uFEFF/, ""))
  )

  return rows
    .slice(1)
    .map((row) => {
      const item: Record<string, string> = {}

      headers.forEach((header, index) => {
        item[header] = String(row[index] || "").trim()
      })

      return {
        activo: item.activo || "",
        nombre: item.nombre || "",
        ciudad: item.ciudad || "",
        departamento: item.departamento || "",
        direccion: item.direccion || "",
        telefono: item.telefono || "",
        whatsapp: item.whatsapp || "",
        instagram: item.instagram || "",
        web: item.web || "",
        maps: item.maps || "",
        tipo: item.tipo || "",
        orden: item.orden || "",
      }
    })
    .filter((store) => store.nombre)
}

function isActiveStore(store: StoreLocation) {
  const activeValue = normalizeText(store.activo)

  return (
    activeValue === "si" ||
    activeValue === "sí" ||
    activeValue === "s" ||
    activeValue === "true" ||
    activeValue === "1" ||
    activeValue === "activo"
  )
}

function getStoreOrder(store: StoreLocation) {
  const parsedOrder = Number(store.orden)
  return Number.isFinite(parsedOrder) ? parsedOrder : 9999
}

function getWhatsAppUrl(value: string) {
  const cleanNumber = value.replace(/\D/g, "")

  if (!cleanNumber) return ""

  return `https://wa.me/${cleanNumber}`
}

function normalizeUrl(value: string) {
  const trimmed = value.trim()

  if (!trimmed) return ""

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed
  }

  return `https://${trimmed}`
}

export default function DondeComprarPage() {
  const [stores, setStores] = useState<StoreLocation[]>([])
  const [selectedCity, setSelectedCity] = useState("Todas")
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    const loadStores = async () => {
      try {
        setLoading(true)
        setErrorMessage("")

        const response = await fetch(`${STORES_CSV_URL}&t=${Date.now()}`)

        if (!response.ok) {
          throw new Error("No fue posible cargar el listado de tiendas.")
        }

        const csv = await response.text()
        const parsedStores = parseStoresCsv(csv)

        setStores(parsedStores)
      } catch (error) {
        console.error(error)
        setErrorMessage(
          "No fue posible cargar los puntos de venta en este momento."
        )
      } finally {
        setLoading(false)
      }
    }

    loadStores()
  }, [])

  const activeStores = useMemo(() => {
    return stores
      .filter(isActiveStore)
      .sort((firstStore, secondStore) => {
        const cityCompare = firstStore.ciudad.localeCompare(
          secondStore.ciudad,
          "es",
          { sensitivity: "base" }
        )

        if (cityCompare !== 0) return cityCompare

        const orderCompare = getStoreOrder(firstStore) - getStoreOrder(secondStore)

        if (orderCompare !== 0) return orderCompare

        return firstStore.nombre.localeCompare(secondStore.nombre, "es", {
          sensitivity: "base",
        })
      })
  }, [stores])

  const cities = useMemo(() => {
    const uniqueCities = Array.from(
      new Set(
        activeStores
          .map((store) => store.ciudad.trim())
          .filter((city) => city.length > 0)
      )
    )

    return uniqueCities.sort((firstCity, secondCity) =>
      firstCity.localeCompare(secondCity, "es", { sensitivity: "base" })
    )
  }, [activeStores])

  const filteredStores = useMemo(() => {
    if (selectedCity === "Todas") return activeStores

    return activeStores.filter(
      (store) => normalizeText(store.ciudad) === normalizeText(selectedCity)
    )
  }, [activeStores, selectedCity])

  const storesByCity = useMemo(() => {
    return filteredStores.reduce<Record<string, StoreLocation[]>>(
      (groups, store) => {
        const city = store.ciudad || "Sin ciudad"

        if (!groups[city]) {
          groups[city] = []
        }

        groups[city].push(store)
        return groups
      },
      {}
    )
  }, [filteredStores])

  const groupedCities = Object.keys(storesByCity).sort((firstCity, secondCity) =>
    firstCity.localeCompare(secondCity, "es", { sensitivity: "base" })
  )

  return (
    <main className="min-h-screen bg-neutral-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="shrink-0">
              <img
                src="/logos/movitec-games.jpg"
                alt="Movitec Games"
                className="h-16 w-auto max-w-[180px] object-contain"
              />
            </Link>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Puntos de venta
              </p>
              <h1 className="text-xl font-bold tracking-tight">Dónde comprar</h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Inicio
            </Link>

            <Link
              href="/productos"
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Catálogo
            </Link>
          </div>
        </div>
      </header>

      <section className="bg-gradient-to-b from-slate-950 to-slate-800 text-white">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.24em] text-amber-300">
            Tiendas aliadas · Puntos de venta · Canal retail
          </p>

          <h2 className="max-w-4xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            Encuentra dónde comprar los juegos distribuidos por Movitec Games.
          </h2>

          <p className="mt-5 max-w-3xl text-lg text-slate-300">
            Consulta tiendas físicas, tiendas online y puntos aliados organizados por ciudad.
            El listado se actualiza conforme nuevos comercios se vinculan al canal.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
                Buscar por ciudad
              </p>
              <h3 className="mt-2 text-2xl font-bold tracking-tight">
                Puntos disponibles
              </h3>
            </div>

            <div className="w-full sm:w-72">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Ciudad
              </label>
              <select
                value={selectedCity}
                onChange={(event) => setSelectedCity(event.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
              >
                <option value="Todas">Todas las ciudades</option>
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-5 text-sm text-slate-500">
            {loading
              ? "Cargando puntos de venta…"
              : `${filteredStores.length} punto${
                  filteredStores.length === 1 ? "" : "s"
                } de venta activo${filteredStores.length === 1 ? "" : "s"}`}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-16">
        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center">
            <p className="text-lg font-semibold">Cargando puntos de venta…</p>
            <p className="mt-2 text-slate-500">
              Estamos consultando el listado actualizado.
            </p>
          </div>
        ) : errorMessage ? (
          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-12 text-center">
            <p className="text-lg font-semibold text-amber-900">
              {errorMessage}
            </p>
            <p className="mt-2 text-amber-900/80">
              Intenta nuevamente en unos minutos.
            </p>
          </div>
        ) : !filteredStores.length ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <p className="text-lg font-semibold">
              No hay puntos de venta activos para esta ciudad.
            </p>
            <p className="mt-2 text-slate-500">
              Pronto agregaremos más tiendas aliadas.
            </p>
          </div>
        ) : (
          <div className="space-y-10">
            {groupedCities.map((city) => (
              <div key={city}>
                <div className="mb-5 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
                      Ciudad
                    </p>
                    <h3 className="mt-1 text-3xl font-bold tracking-tight">
                      {city}
                    </h3>
                  </div>

                  <div className="text-sm text-slate-500">
                    {storesByCity[city].length} punto
                    {storesByCity[city].length === 1 ? "" : "s"}
                  </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {storesByCity[city].map((store) => {
                    const whatsappUrl = getWhatsAppUrl(store.whatsapp)
                    const instagramUrl = normalizeUrl(store.instagram)
                    const webUrl = normalizeUrl(store.web)
                    const mapsUrl = normalizeUrl(store.maps)

                    return (
                      <article
                        key={`${store.ciudad}-${store.nombre}`}
                        className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                              {store.tipo || "Tienda aliada"}
                            </p>
                            <h4 className="mt-2 text-xl font-bold tracking-tight">
                              {store.nombre}
                            </h4>
                          </div>

                          {store.departamento ? (
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                              {store.departamento}
                            </span>
                          ) : null}
                        </div>

                        {store.direccion ? (
                          <p className="mt-4 text-sm leading-6 text-slate-600">
                            {store.direccion}
                          </p>
                        ) : (
                          <p className="mt-4 text-sm leading-6 text-slate-400">
                            Dirección pendiente por confirmar.
                          </p>
                        )}

                        {store.telefono ? (
                          <p className="mt-3 text-sm text-slate-500">
                            Teléfono: {store.telefono}
                          </p>
                        ) : null}

                        <div className="mt-6 flex flex-wrap gap-2">
                          {whatsappUrl ? (
                            <a
                              href={whatsappUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                            >
                              WhatsApp
                            </a>
                          ) : null}

                          {instagramUrl ? (
                            <a
                              href={instagramUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                            >
                              Instagram
                            </a>
                          ) : null}

                          {webUrl ? (
                            <a
                              href={webUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                            >
                              Web
                            </a>
                          ) : null}

                          {mapsUrl ? (
                            <a
                              href={mapsUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                            >
                              Mapa
                            </a>
                          ) : null}
                        </div>
                      </article>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}