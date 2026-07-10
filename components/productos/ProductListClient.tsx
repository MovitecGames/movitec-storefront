"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { medusa } from "../../lib/medusa"
import {
  createCart,
  createLineItem,
  retrieveCart,
} from "../../lib/medusa-cart"
import {
  getStoredCartId,
  setStoredCartId,
  clearStoredCheckoutState,
} from "../../lib/cart-storage"

export type ProductListItem = {
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
    id: string
    inventory_quantity?: number | null
    manage_inventory?: boolean | null
    allow_backorder?: boolean | null
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

type CatalogReturnState = {
  pathname: "/productos"
  searchQuery: string
  selectedEditorial: string
  selectedTag: string
  scrollY: number
}

const CATALOG_RETURN_STATE_KEY = "movitec_catalog_return_state"

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

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  return String(error || "")
}

function isCompletedCartError(error: unknown) {
  return getErrorMessage(error).toLowerCase().includes("already completed")
}

function isInventoryError(error: unknown) {
  const message = getErrorMessage(error).toLowerCase()

  return (
    message.includes("required inventory") ||
    message.includes("does not have the required inventory") ||
    message.includes("insufficient inventory") ||
    message.includes("not enough inventory") ||
    message.includes("out of stock")
  )
}

function clearStoredCartState() {
  clearStoredCheckoutState()
}

function normalizeText(value: unknown) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
}

function getProductSearchText(product: ProductListItem) {
  const tags = product.tags?.map((tag) => tag.value).join(" ") || ""
  const type = product.type?.value || ""
  const collection = product.collection?.title || ""

  return normalizeText(
    [product.title, product.subtitle, tags, type, collection].join(" ")
  )
}

function productMatchesEditorial(
  product: ProductListItem,
  editorialName: string
) {
  const editorial = EDITORIALS.find((item) => item.name === editorialName)

  if (!editorial) return false

  const searchText = getProductSearchText(product)

  return editorial.keywords.some((keyword) =>
    searchText.includes(normalizeText(keyword))
  )
}

function getEditorialCount(
  products: ProductListItem[],
  editorialName: string
) {
  return products.filter((product) =>
    productMatchesEditorial(product, editorialName)
  ).length
}

function getProductInventoryQuantity(product: ProductListItem) {
  const inventoryQuantities =
    product.variants
      ?.map((variant) => variant.inventory_quantity)
      .filter(
        (quantity): quantity is number => typeof quantity === "number"
      ) || []

  if (!inventoryQuantities.length) return null

  return inventoryQuantities.reduce(
    (total, quantity) => total + quantity,
    0
  )
}

function getProductStockStatus(product: ProductListItem) {
  const inventoryQuantity = getProductInventoryQuantity(product)

  if (inventoryQuantity === null) {
    return {
      label: "Disponible",
      helperText: "Producto disponible en catálogo.",
      className: "border-emerald-200 bg-emerald-50 text-emerald-700",
      isSoldOut: false,
    }
  }

  if (inventoryQuantity <= 0) {
    return {
      label: "Agotado temporalmente",
      helperText:
        "Este título hace parte de nuestro catálogo activo y pronto volverá a estar disponible.",
      className: "border-slate-300 bg-slate-100 text-slate-600",
      isSoldOut: true,
    }
  }

  if (inventoryQuantity <= 5) {
    return {
      label: "Pocas unidades",
      helperText:
        "Quedan pocas unidades disponibles para pedido inmediato.",
      className: "border-amber-200 bg-amber-50 text-amber-700",
      isSoldOut: false,
    }
  }

  return {
    label: "Disponible",
    helperText: "Producto disponible para pedido inmediato.",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    isSoldOut: false,
  }
}

export default function ProductListClient({
  initialProducts,
}: {
  initialProducts: ProductListItem[]
}) {
  const [products] = useState<ProductListItem[]>(initialProducts)
  const [customer, setCustomer] = useState<CustomerItem | null>(null)

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedEditorial, setSelectedEditorial] = useState("Todos")
  const [selectedTag, setSelectedTag] = useState("Todos")
  const [addingProductId, setAddingProductId] = useState<string | null>(
    null
  )

  useEffect(() => {
    try {
      const storedState = window.sessionStorage.getItem(
        CATALOG_RETURN_STATE_KEY
      )

      if (!storedState) return

      const parsedState = JSON.parse(storedState) as CatalogReturnState

      if (parsedState.pathname !== "/productos") return

      setSearchQuery(parsedState.searchQuery || "")
      setSelectedEditorial(parsedState.selectedEditorial || "Todos")
      setSelectedTag(parsedState.selectedTag || "Todos")

      window.setTimeout(() => {
        window.scrollTo({
          top:
            typeof parsedState.scrollY === "number"
              ? parsedState.scrollY
              : 0,
          behavior: "auto",
        })

        window.sessionStorage.removeItem(CATALOG_RETURN_STATE_KEY)
      }, 100)
    } catch (error) {
      console.error(
        "Error restaurando el estado del catálogo:",
        error
      )

      window.sessionStorage.removeItem(CATALOG_RETURN_STATE_KEY)
    }
  }, [])

  useEffect(() => {
    const loadCustomer = async () => {
      try {
        const currentCustomer = await medusa.store.customer
          .retrieve()
          .then(({ customer }) => customer)
          .catch(() => null)

        setCustomer(currentCustomer)
      } catch (error) {
        console.error(error)
      }
    }

    loadCustomer()
  }, [])

  const saveCatalogReturnState = () => {
    const state: CatalogReturnState = {
      pathname: "/productos",
      searchQuery,
      selectedEditorial,
      selectedTag,
      scrollY: window.scrollY,
    }

    window.sessionStorage.setItem(
      CATALOG_RETURN_STATE_KEY,
      JSON.stringify(state)
    )
  }

  const ensureValidCartId = async () => {
    let cartId = getStoredCartId()

    if (!cartId) {
      const created = await createCart()
      const newCartId = created?.cart?.id

      if (!newCartId) {
        throw new Error("No fue posible crear el carrito.")
      }

      setStoredCartId(newCartId)

      return newCartId
    }

    try {
      await retrieveCart(cartId)

      return cartId
    } catch (error) {
      if (isCompletedCartError(error)) {
        clearStoredCartState()
      }

      const created = await createCart()
      const newCartId = created?.cart?.id

      if (!newCartId) {
        throw new Error("No fue posible crear un carrito nuevo.")
      }

      setStoredCartId(newCartId)

      return newCartId
    }
  }

  const handleAddToCart = async (product: ProductListItem) => {
    try {
      const variant = product.variants?.[0]
      const stockStatus = getProductStockStatus(product)

      if (!variant?.id) {
        alert("Este producto no tiene una variante válida para compra.")
        return
      }

      if (stockStatus.isSoldOut) {
        alert(
          "Este producto está agotado temporalmente. Hace parte de nuestro catálogo activo y pronto volverá a estar disponible."
        )
        return
      }

      setAddingProductId(product.id)

      let cartId = await ensureValidCartId()

      try {
        await createLineItem(cartId, {
          variant_id: variant.id,
          quantity: 1,
        })

        alert("Producto agregado al carrito.")
      } catch (error) {
        if (isCompletedCartError(error)) {
          clearStoredCartState()

          cartId = await ensureValidCartId()

          await createLineItem(cartId, {
            variant_id: variant.id,
            quantity: 1,
          })

          alert("Producto agregado al carrito.")
          return
        }

        throw error
      }
    } catch (error) {
      console.error("ERROR AGREGANDO AL CARRITO:", error)

      if (isInventoryError(error)) {
        alert(
          "Este producto está agotado temporalmente o no cuenta con unidades suficientes para la cantidad solicitada. Pronto volverá a estar disponible."
        )
        return
      }

      alert("No fue posible agregar el producto al carrito.")
    } finally {
      setAddingProductId(null)
    }
  }

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
        selectedTag === "Todos" ||
        searchText.includes(normalizedTag)

      return matchesSearch && matchesEditorial && matchesTag
    })
  }, [products, searchQuery, selectedEditorial, selectedTag])

  return (
    <main className="min-h-screen bg-neutral-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="shrink-0">
              <img
                src="/logos/movitec-games.jpg"
                alt="Movitec Games distribuidor B2B de juegos de mesa modernos en Colombia"
                className="h-16 w-auto max-w-[180px] object-contain"
              />
            </Link>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Catálogo completo
              </p>

              <h1 className="text-xl font-bold tracking-tight">
                Movitec Games
              </h1>
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
              </div>
            )}
          </div>
        </div>
      </header>

      <section className="bg-gradient-to-b from-slate-950 to-slate-800 text-white">
        <div className="mx-auto max-w-7xl px-6 py-14">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.24em] text-amber-300">
            Todos los productos disponibles
          </p>

          <h2 className="max-w-4xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            Explora el catálogo completo de juegos de mesa modernos.
          </h2>

          <p className="mt-5 max-w-3xl text-lg text-slate-300">
            Encuentra juegos por nombre, editorial, cantidad de jugadores,
            tipo de experiencia o características comerciales. Los precios
            siguen visibles únicamente para clientes autorizados.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
                Filtros
              </p>

              <h3 className="mt-2 text-2xl font-bold tracking-tight">
                Busca y organiza el catálogo
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

          <div className="mt-6 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Buscar juego
              </label>

              <input
                type="search"
                value={searchQuery}
                onChange={(event) =>
                  setSearchQuery(event.target.value)
                }
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
                onChange={(event) =>
                  setSelectedTag(event.target.value)
                }
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
              >
                <option value="Todos">
                  Todas las características
                </option>

                {QUICK_TAGS.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
            </div>
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
                <span className="text-sm font-bold text-slate-900">
                  Todos
                </span>
              </div>

              <p className="mt-3 text-sm font-bold">Todas</p>

              <p
                className={`mt-1 text-xs ${
                  selectedEditorial === "Todos"
                    ? "text-slate-300"
                    : "text-slate-500"
                }`}
              >
                {products.length} productos
              </p>
            </button>

            {EDITORIALS.map((editorial) => {
              const count = getEditorialCount(
                products,
                editorial.name
              )

              return (
                <button
                  key={editorial.name}
                  type="button"
                  onClick={() =>
                    setSelectedEditorial(editorial.name)
                  }
                  className={`rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md ${
                    selectedEditorial === editorial.name
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-slate-50 text-slate-900"
                  }`}
                >
                  <div className="flex h-16 items-center justify-center rounded-xl bg-white p-3">
                    <img
                      src={editorial.logo}
                      alt={`${editorial.name} juegos de mesa en Colombia`}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>

                  <p className="mt-3 text-sm font-bold">
                    {editorial.name}
                  </p>

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

          <div className="mt-6 flex flex-wrap gap-2">
            {QUICK_TAGS.map((tag) => (
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
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-16">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
              Resultados
            </p>

            <h3 className="mt-2 text-3xl font-bold tracking-tight">
              Catálogo completo
            </h3>
          </div>

          <div className="text-sm text-slate-500">
            {filteredProducts.length} de {products.length} productos
          </div>
        </div>

        {!products.length ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <p className="text-lg font-semibold">
              No hay productos disponibles todavía.
            </p>

            <p className="mt-2 text-slate-500">
              Cuando publiques productos en Medusa, aparecerán aquí
              automáticamente.
            </p>
          </div>
        ) : !filteredProducts.length ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <p className="text-lg font-semibold">
              No encontramos juegos con ese filtro.
            </p>

            <p className="mt-2 text-slate-500">
              Prueba con otra palabra, editorial o característica.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((product) => {
              const image =
                product.thumbnail ||
                product.images?.[0]?.url ||
                null

              const price =
                product.variants?.[0]?.calculated_price
                  ?.calculated_amount

              const currency =
                product.variants?.[0]?.calculated_price?.currency_code?.toUpperCase() ||
                "COP"

              const stockStatus = getProductStockStatus(product)

              return (
                <article
                  key={product.id}
                  className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="relative aspect-square bg-slate-100">
                    {image ? (
                      <img
                        src={image}
                        alt={`${product.title} juego de mesa moderno en Colombia`}
                        className={`h-full w-full object-cover ${
                          stockStatus.isSoldOut
                            ? "opacity-60 grayscale"
                            : ""
                        }`}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-slate-400">
                        Sin imagen
                      </div>
                    )}

                    <div className="absolute left-3 top-3">
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-bold shadow-sm ${stockStatus.className}`}
                      >
                        {stockStatus.label}
                      </span>
                    </div>
                  </div>

                  <div className="p-5">
                    <h4 className="min-h-[3.4rem] text-base font-semibold">
                      {product.title}
                    </h4>

                    {product.subtitle ? (
                      <p className="mt-2 text-sm text-slate-500">
                        {product.subtitle}
                      </p>
                    ) : (
                      <p className="mt-2 text-sm text-slate-400">
                        Producto disponible en catálogo.
                      </p>
                    )}

                    <p className="mt-3 text-xs font-medium text-slate-500">
                      {stockStatus.helperText}
                    </p>

                    {product.tags?.length ? (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {product.tags.slice(0, 4).map((tag) => (
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
                      {customer &&
                      isApproved &&
                      typeof price === "number" ? (
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

                    <div className="mt-5 flex flex-wrap gap-2">
                      {product.handle ? (
                        <Link
                          href={`/productos/${product.handle}`}
                          onClick={saveCatalogReturnState}
                          className="inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                        >
                          Ver producto
                        </Link>
                      ) : (
                        <span className="inline-flex rounded-xl bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-500">
                          Sin enlace
                        </span>
                      )}

                      {customer && isApproved && (
                        <button
                          type="button"
                          onClick={() => handleAddToCart(product)}
                          disabled={
                            addingProductId === product.id ||
                            stockStatus.isSoldOut
                          }
                          className="inline-flex rounded-xl border border-slate-900 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {addingProductId === product.id
                            ? "Agregando..."
                            : stockStatus.isSoldOut
                              ? "Agotado"
                              : "Añadir al carrito"}
                        </button>
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
        )}
      </section>
    </main>
  )
}