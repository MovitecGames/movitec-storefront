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
  const isApproved = customer?.metadata?.approved === true

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
              {customer && isApproved && typeof price === "number" ? (
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

            {!customer && (
              <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-6">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Público general
                </p>
                <h2 className="mt-3 text-xl font-bold tracking-tight">
                  ¿Te interesa este juego?
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Este sitio está orientado al canal comercial. Si eres cliente final,
                  puedes consultar este producto a través de tiendas aliadas o del canal retail.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <a
                    href="https://tiendamovitec.com"
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
                  >
                    Ir a canal retail
                  </a>

                  <Link
                    href="/solicitar-acceso"
                    className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Solicitar acceso comercial
                  </Link>
                </div>
              </div>
            )}

            {customer && !isApproved && (
              <div className="mt-10 rounded-2xl border border-amber-200 bg-amber-50 p-6">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-700">
                  Cuenta en revisión
                </p>
                <h2 className="mt-3 text-xl font-bold tracking-tight text-amber-900">
                  Tu perfil comercial aún no está aprobado
                </h2>
                <p className="mt-3 text-sm leading-6 text-amber-900/80">
                  Ya registramos tu solicitud. Una vez validemos tu documentación,
                  se habilitarán precios y condiciones B2B para este producto.
                </p>
              </div>
            )}

            {customer && isApproved && (
              <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-6">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Cliente autorizado
                </p>
                <h2 className="mt-3 text-xl font-bold tracking-tight">
                  Acceso comercial habilitado
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Tu cuenta ya tiene acceso comercial. En la siguiente fase conectaremos
                  carrito, cotización y flujo de pedido B2B.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    disabled
                    className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white opacity-60"
                  >
                    Pedido B2B próximamente
                  </button>
                </div>
              </div>
            )}

            <div className="mt-6 text-xs text-slate-500">
              Producto disponible para canal B2B Movitec Games.
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}