import Link from "next/link"
import { notFound } from "next/navigation"
import { medusa } from "../../../lib/medusa"
import { getCustomer } from "../../../lib/customer"

type PageProps = {
  params: Promise<{
    handle: string
  }>
}

export default async function ProductPage({ params }: PageProps) {
  const { handle } = await params

  const { products } = await medusa.store.product.list({
    handle,
    country_code: "co",
  })

  const product = products?.[0]

  if (!product) {
    notFound()
  }

  const customer = await getCustomer()

  const image = product.thumbnail || product.images?.[0]?.url || ""
  const price = product.variants?.[0]?.calculated_price?.calculated_amount
  const currency =
    product.variants?.[0]?.calculated_price?.currency_code?.toUpperCase()

  return (
    <main className="min-h-screen bg-neutral-50 text-slate-900">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <Link
          href="/"
          className="mb-6 inline-flex text-sm font-medium text-slate-500 hover:text-slate-900"
        >
          ← Volver al catálogo
        </Link>

        <div className="grid gap-10 lg:grid-cols-2">
          <div className="overflow-hidden rounded-3xl bg-slate-100">
            {image ? (
              <img
                src={image}
                alt={product.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex aspect-square items-center justify-center text-slate-400">
                Sin imagen
              </div>
            )}
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
              Producto
            </p>

            <h1 className="mt-2 text-4xl font-bold tracking-tight">
              {product.title}
            </h1>

            {product.subtitle ? (
              <p className="mt-3 text-lg text-slate-600">
                {product.subtitle}
              </p>
            ) : null}

            <div className="mt-6">
              {customer && typeof price === "number" ? (
                <p className="text-3xl font-bold">
                  {new Intl.NumberFormat("es-CO", {
                    style: "currency",
                    currency: currency || "COP",
                    maximumFractionDigits: 0,
                  }).format(price)}
                </p>
              ) : (
                <p className="text-base font-medium text-slate-500">
                  Precio disponible para clientes autorizados
                </p>
              )}
            </div>

            {product.description ? (
              <div className="mt-8">
                <h2 className="text-lg font-semibold">Descripción</h2>
                <p className="mt-2 whitespace-pre-line text-slate-600">
                  {product.description}
                </p>
              </div>
            ) : null}

            <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                Acceso comercial
              </p>
              <h2 className="mt-3 text-xl font-bold tracking-tight">
                Condiciones visibles solo para tiendas aprobadas
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Para consultar precios, condiciones comerciales y disponibilidad
                bajo perfil B2B, debes tener una cuenta aprobada por Movitec Games.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/login"
                  className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  Iniciar sesión
                </Link>

                <Link
                  href="/solicitar-acceso"
                  className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Solicitar acceso comercial
                </Link>
              </div>
            </div>

            <div className="mt-6 text-xs text-slate-500">
              Producto disponible para canal B2B Movitec Games.
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}