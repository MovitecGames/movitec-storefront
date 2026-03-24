"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { medusa } from "../lib/medusa"

type ProductItem = {
  id: string
  title: string
  subtitle?: string | null
  handle?: string | null
  thumbnail?: string | null
  images?: { url?: string | null }[]
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

export default function Home() {
  const [products, setProducts] = useState<ProductItem[]>([])
  const [customer, setCustomer] = useState<CustomerItem | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const productsPromise = medusa.store.product.list({
          country_code: "co",
          fields: "*variants.calculated_price,+images",
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
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              Distribución B2B
            </p>
            <h1 className="text-xl font-bold tracking-tight">Movitec Games</h1>
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

      <section id="catalogo" className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
              Catálogo
            </p>
            <h3 className="mt-2 text-3xl font-bold tracking-tight">Juegos destacados</h3>
          </div>

          <div className="text-sm text-slate-500">{products.length} productos</div>
        </div>

        {!products.length ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <p className="text-lg font-semibold">No hay productos disponibles todavía.</p>
            <p className="mt-2 text-slate-500">
              Cuando publiques productos en Medusa, aparecerán aquí automáticamente.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => {
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
        )}
      </section>
    </main>
  )
}