"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { medusa } from "../lib/medusa"

type ProductItem = {
  id: string
  title: string
  subtitle?: string | null
  handle?: string | null
  thumbnail?: string | null
  images?: { url?: string | null }[]
  tags?: {
    id?: string
    value?: string
  }[]
  type?: {
    id?: string
    value?: string
  } | null
  collection?: {
    id?: string
    title?: string
  } | null
  variants?: {
    calculated_price?: {
      calculated_amount?: number
      currency_code?: string
    }
  }[]
}

type CustomerItem = {
  email?: string
  metadata?: {
    approved?: boolean
  } | null
}

const EDITORIALS = [
  {
    name: "2Tomatoes",
    logo: "/logos/2tomatoes.jpg",
    keywords: ["2tomatoes", "2 tomatoes", "2tomato", "tomatoes"],
  },
  {
    name: "Arrakis Games",
    logo: "/logos/arrakis-games.png",
    keywords: ["arrakis", "arrakis games"],
  },
  {
    name: "SD Games",
    logo: "/logos/sd-games.png",
    keywords: ["sd games", "sd"],
  },
  {
    name: "Delirium Games",
    logo: "/logos/delirium-games.jpg",
    keywords: ["delirium", "delirium games"],
  },
  {
    name: "Bumblebee",
    logo: "/logos/bumblebee.jpg",
    keywords: ["bumblebee", "bumble bee"],
  },
  {
    name: "Más Que Oca",
    logo: "/logos/mas-que-oca.png",
    keywords: ["mas que oca", "más que oca", "mqo"],
  },
  {
    name: "Megacorpin Games",
    logo: "/logos/megacorpin-games.png",
    keywords: ["megacorpin", "megacorpin games"],
  },
  {
    name: "Tranjis Games",
    logo: "/logos/tranjis-games.png",
    keywords: ["tranjis", "tranjis games"],
  },
  {
    name: "Salt & Pepper Games",
    logo: "/logos/salt-and-pepper-games.png",
    keywords: [
      "salt and pepper",
      "salt & pepper",
      "salt pepper",
      "salt-and-pepper",
      "salt and pepper games",
      "salt & pepper games",
    ],
  },
]

const QUICK_TAGS = [
  "Familiar",
  "Estrategia",
  "Party",
  "Cooperativo",
  "Solitario",
  "Cartas",
  "Aventura",
  "Infantil",
  "Abstracto",
  "1 a 4 jugadores",
  "2 a 5 jugadores",
  "3 a 8 jugadores",
  "4 a 10 jugadores",
]

function normalizeText(value: unknown) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
}

function getProductSearchText(product: ProductItem) {
  const tags = product.tags?.map((tag) => tag.value).join(" ") || ""
  const type = product.type?.value || ""
  const collection = product.collection?.title || ""

  return normalizeText(
    [
      product.title,
      product.subtitle,
      tags,
      type,
      collection,
    ].join(" ")
  )
}

function productMatchesEditorial(product: ProductItem, editorialName: string) {
  const editorial = EDITORIALS.find((item) => item.name === editorialName)
  if (!editorial) return false

  const searchText = getProductSearchText(product)

  return editorial.keywords.some((keyword) =>
    searchText.includes(normalizeText(keyword))
  )
}

function getEditorialCount(products: ProductItem[], editorialName: string) {
  return products.filter((product) =>
    productMatchesEditorial(product, editorialName)
  ).length
}

export default function Home() {
  const [products, setProducts] = useState<ProductItem[]>([])
  const [customer, setCustomer] = useState<CustomerItem | null>(null)
  const [loading, setLoading] = useState(true)

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedEditorial, setSelectedEditorial] = useState("Todos")
  const [selectedTag, setSelectedTag] = useState("Todos")

  useEffect(() => {
    const loadData = async () => {
      try {
        const productsPromise = medusa.store.product.list({
          country_code: "co",
          limit: 200,
          fields:
            "*variants.calculated_price,+images,+tags,+type,+collection",
        })

        const customerPromise = medusa.store.customer
          .retrieve()
          .then(({ customer }) => customer)
          .catch(() => null)

        const [{ products }, currentCustomer] = await Promise.all([
          productsPromise,
          customerPromise,
        ])

        setProducts(products || [])
        setCustomer(currentCustomer)
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const isApproved = customer?.metadata?.approved === true

  const filteredProducts = useMemo(() => {
    const normalizedQuery = normalizeText(searchQuery)
    const normalizedTag = normalizeText(selectedTag)

    return products.filter((product) => {
      const searchText = getProductSearchText(product)

      const matchesSearch =
        !normalizedQuery || searchText.includes(normalizedQuery)

      const matchesEditorial =
        selectedEditorial === "Todos" ||
        productMatchesEditorial(product, selectedEditorial)

      const matchesTag =
        selectedTag === "Todos" || searchText.includes(normalizedTag)

      return matchesSearch && matchesEditorial && matchesTag
    })
  }, [products, searchQuery, selectedEditorial, selectedTag])

  const visibleProducts = filteredProducts.slice(0, 24)

  if (loading) {
    return (
      <main className="min-h-screen bg-neutral-50 text-slate-900">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <p className="text-sm text-slate-500">Cargando plataforma…</p>
        </div>
      </main>
    )
  }

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
                Distribución B2B
              </p>
              <h1 className="text-xl font-bold tracking-tight">Movitec Games</h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/carrito"
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              🛒 Carrito
            </Link>

            {!customer ? (
              <>
                <Link
                  href="/login"
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Ingresar como tienda
                </Link>

                <Link
                  href="/solicitar-acceso"
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  Solicitar acceso comercial
                </Link>
              </>
            ) : (
              <div className="text-right">
                <p className="text-sm font-medium">{customer.email}</p>
                <p className="text-xs text-slate-500">
                  {isApproved ? "Cuenta aprobada" : "Cuenta en revisión"}
                </p>

                <div className="mt-2 flex flex-wrap justify-end gap-2">
                  <Link
                    href="/cuenta/pedidos"
                    className="text-xs font-semibold text-slate-600 underline-offset-4 hover:text-slate-900 hover:underline"
                  >
                    Historial de pedidos
                  </Link>

                  <span className="text-xs text-slate-300">|</span>

                  <Link
                    href="/cuenta/pedidos"
                    className="text-xs font-semibold text-slate-600 underline-offset-4 hover:text-slate-900 hover:underline"
                  >
                    Estado de pedidos
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <section className="bg-gradient-to-b from-slate-950 to-slate-800 text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-20 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.24em] text-amber-300">
              Juegos modernos · Canal retail y comercial
            </p>

            <h2 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
              Descubre juegos de mesa modernos y accede a nuestro canal comercial para tiendas.
            </h2>

            <p className="mt-6 max-w-2xl text-lg text-slate-300">
              Movitec Games conecta el catálogo con el mercado. Los visitantes pueden explorar
              los títulos disponibles, y las tiendas aprobadas acceden a condiciones comerciales,
              precios y operación B2B.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="#catalogo"
                className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-200"
              >
                Ver juegos
              </a>

              <Link
                href="/productos"
                className="rounded-xl border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Ver catálogo completo
              </Link>

              {!customer && (
                <Link
                  href="/login"
                  className="rounded-xl border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Ingresar como tienda
                </Link>
              )}

              {!customer && (
                <Link
                  href="/solicitar-acceso"
                  className="rounded-xl border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Solicitar acceso comercial
                </Link>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
            <div className="rounded-2xl bg-white p-6 text-slate-900">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                Dos vías de acceso
              </p>
              <h3 className="mt-3 text-2xl font-bold tracking-tight">
                Catálogo abierto, condiciones comerciales restringidas
              </h3>

              <ul className="mt-6 space-y-4 text-sm text-slate-600">
                <li className="rounded-xl bg-slate-50 p-4">
                  Público general: puede explorar el catálogo y consultar los títulos disponibles.
                </li>
                <li className="rounded-xl bg-slate-50 p-4">
                  Tiendas aprobadas: pueden ingresar y acceder a precios y operación B2B.
                </li>
                <li className="rounded-xl bg-slate-50 p-4">
                  La habilitación comercial requiere revisión documental previa.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {customer && !isApproved && (
        <section className="mx-auto max-w-7xl px-6 pt-12">
          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-amber-700">
              Cuenta en revisión
            </p>
            <h3 className="mt-3 text-2xl font-bold tracking-tight text-amber-900">
              Tu solicitud está siendo validada
            </h3>
            <p className="mt-4 max-w-3xl text-amber-900/80">
              Ya recibimos tu información. Una vez aprobemos tu perfil comercial, se habilitará
              la visualización de precios y condiciones B2B dentro de la plataforma.
            </p>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-6 pt-14">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
                Explora por editorial
              </p>
              <h3 className="mt-2 text-2xl font-bold tracking-tight">
                Catálogo organizado para encontrar más rápido
              </h3>
            </div>

            <button
              type="button"
              onClick={() => {
                setSelectedEditorial("Todos")
                setSelectedTag("Todos")
                setSearchQuery("")
              }}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Limpiar filtros
            </button>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            <button
              type="button"
              onClick={() => setSelectedEditorial("Todos")}
              className={`rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md ${
                selectedEditorial === "Todos"
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-slate-50 text-slate-900"
              }`}
            >
              <div className="flex h-16 items-center justify-center rounded-xl bg-white p-3">
                <span className="text-sm font-bold text-slate-900">Todos</span>
              </div>
              <p className="mt-3 text-sm font-bold">Todas las editoriales</p>
              <p
                className={`mt-1 text-xs ${
                  selectedEditorial === "Todos" ? "text-slate-300" : "text-slate-500"
                }`}
              >
                {products.length} productos
              </p>
            </button>

            {EDITORIALS.map((editorial) => {
              const count = getEditorialCount(products, editorial.name)

              return (
                <button
                  key={editorial.name}
                  type="button"
                  onClick={() => setSelectedEditorial(editorial.name)}
                  className={`rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md ${
                    selectedEditorial === editorial.name
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-slate-50 text-slate-900"
                  }`}
                >
                  <div className="flex h-16 items-center justify-center rounded-xl bg-white p-3">
                    <img
                      src={editorial.logo}
                      alt={editorial.name}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <p className="mt-3 text-sm font-bold">{editorial.name}</p>
                  <p
                    className={`mt-1 text-xs ${
                      selectedEditorial === editorial.name
                        ? "text-slate-300"
                        : "text-slate-500"
                    }`}
                  >
                    {count} productos
                  </p>
                </button>
              )
            })}
          </div>
        </div>
      </section>

      <section id="catalogo" className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
              Catálogo
            </p>
            <h3 className="mt-2 text-3xl font-bold tracking-tight">
              Juegos destacados
            </h3>
          </div>

          <div className="text-sm text-slate-500">
            {filteredProducts.length} de {products.length} productos
          </div>
        </div>

        <div className="mb-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Buscar juego
              </label>
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Buscar por nombre, editorial, tag o característica..."
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Filtrar por característica
              </label>
              <select
                value={selectedTag}
                onChange={(event) => setSelectedTag(event.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
              >
                <option value="Todos">Todas las características</option>
                {QUICK_TAGS.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {QUICK_TAGS.slice(0, 8).map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setSelectedTag(tag)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  selectedTag === tag
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {!products.length ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <p className="text-lg font-semibold">No hay productos disponibles todavía.</p>
            <p className="mt-2 text-slate-500">
              Cuando publiques productos en Medusa, aparecerán aquí automáticamente.
            </p>
          </div>
        ) : !filteredProducts.length ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <p className="text-lg font-semibold">No encontramos juegos con ese filtro.</p>
            <p className="mt-2 text-slate-500">
              Prueba con otra palabra, editorial o característica.
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {visibleProducts.map((product) => {
                const image = product.thumbnail || product.images?.[0]?.url || null
                const price =
                  product.variants?.[0]?.calculated_price?.calculated_amount
                const currency =
                  product.variants?.[0]?.calculated_price?.currency_code?.toUpperCase() ||
                  "COP"

                return (
                  <article
                    key={product.id}
                    className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div className="aspect-square bg-slate-100">
                      {image ? (
                        <img
                          src={image}
                          alt={product.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm text-slate-400">
                          Sin imagen
                        </div>
                      )}
                    </div>

                    <div className="p-5">
                      <h4 className="min-h-[3.4rem] text-base font-semibold">
                        {product.title}
                      </h4>

                      {product.subtitle ? (
                        <p className="mt-2 text-sm text-slate-500">{product.subtitle}</p>
                      ) : (
                        <p className="mt-2 text-sm text-slate-400">
                          Producto disponible en catálogo.
                        </p>
                      )}

                      {product.tags?.length ? (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {product.tags.slice(0, 3).map((tag) => (
                            <span
                              key={`${product.id}-${tag.id || tag.value}`}
                              className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500"
                            >
                              {tag.value}
                            </span>
                          ))}
                        </div>
                      ) : null}

                      <div className="mt-4">
                        {customer && isApproved && typeof price === "number" ? (
                          <p className="text-lg font-bold text-slate-900">
                            {new Intl.NumberFormat("es-CO", {
                              style: "currency",
                              currency,
                              maximumFractionDigits: 0,
                            }).format(price)}
                          </p>
                        ) : (
                          <p className="text-sm font-medium text-slate-500">
                            Precio disponible para clientes autorizados
                          </p>
                        )}
                      </div>

                      <div className="mt-5 flex gap-2">
                        <Link
                          href={`/productos/${product.handle}`}
                          className="inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                        >
                          Ver producto
                        </Link>

                        {customer && isApproved && (
                          <span className="inline-flex rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-500">
                            Aprobado
                          </span>
                        )}

                        {customer && !isApproved && (
                          <span className="inline-flex rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-500">
                            En revisión
                          </span>
                        )}
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>

            {filteredProducts.length > visibleProducts.length && (
              <div className="mt-10 flex justify-center">
                <Link
                  href="/productos"
                  className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  Ver catálogo completo
                </Link>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  )
}