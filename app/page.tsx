import Link from "next/link"
import { medusa } from "../lib/medusa"
import { getCustomer } from "../lib/customer"

export default async function Home() {
  const { products } = await medusa.store.product.list({
    country_code: "co",
  })

  const customer = await getCustomer()
  const featuredProducts = products?.slice(0, 8) || []

  return (
    <main className="min-h-screen bg-neutral-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              Distribución B2B
            </p>
            <h1 className="text-xl font-bold tracking-tight">
              Movitec Games
            </h1>
          </div>

          <nav className="hidden gap-6 text-sm font-medium text-slate-600 md:flex">
            <a href="#catalogo" className="hover:text-slate-900">
              Catálogo
            </a>
            <a href="#beneficios" className="hover:text-slate-900">
              Beneficios
            </a>
            <a href="#contacto" className="hover:text-slate-900">
              Contacto
            </a>
          </nav>
        </div>
      </header>

      <section className="bg-gradient-to-b from-slate-950 to-slate-800 text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-20 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.24em] text-amber-300">
              Plataforma para tiendas
            </p>

            <h2 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
              Catálogo mayorista de juegos de mesa para tiendas aprobadas por Movitec Games.
            </h2>

            <p className="mt-6 max-w-2xl text-lg text-slate-300">
              Accede a un portafolio moderno, disponibilidad centralizada y una experiencia
              B2B diseñada para comercios especializados. Las condiciones comerciales y
              precios están disponibles solo para clientes autorizados.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="#catalogo"
                className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-200"
              >
                Ver catálogo
              </a>

              <Link
                href="/login"
                className="rounded-xl border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Iniciar sesión
              </Link>

              <Link
                href="/solicitar-acceso"
                className="rounded-xl border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Solicitar acceso comercial
              </Link>
            </div>

            <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-2xl font-bold">{products?.length || 0}+</p>
                <p className="mt-1 text-sm text-slate-300">Productos visibles</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-2xl font-bold">B2B</p>
                <p className="mt-1 text-sm text-slate-300">Acceso controlado</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-2xl font-bold">CO</p>
                <p className="mt-1 text-sm text-slate-300">Operación Colombia</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
            <div className="rounded-2xl bg-white p-6 text-slate-900">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                Acceso comercial
              </p>
              <h3 className="mt-3 text-2xl font-bold tracking-tight">
                Una vitrina profesional para tiendas aprobadas
              </h3>
              <ul className="mt-6 space-y-4 text-sm text-slate-600">
                <li className="rounded-xl bg-slate-50 p-4">
                  Catálogo centralizado con productos modernos.
                </li>
                <li className="rounded-xl bg-slate-50 p-4">
                  Precios y condiciones visibles solo para clientes autorizados.
                </li>
                <li className="rounded-xl bg-slate-50 p-4">
                  Proceso comercial con validación previa de documentos.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section id="beneficios" className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-10 max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
            Por qué Movitec Games
          </p>
          <h3 className="mt-3 text-3xl font-bold tracking-tight">
            Más que vender juegos: construir una oferta sólida para tiendas.
          </h3>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h4 className="text-lg font-semibold">Catálogo seleccionado</h4>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Una base de productos pensada para el retail especializado y el crecimiento del hobby.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h4 className="text-lg font-semibold">Acceso controlado</h4>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Solo las tiendas aprobadas por Movitec Games acceden a precios, condiciones y operación comercial.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h4 className="text-lg font-semibold">Preparada para crecer</h4>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Base lista para integrar automatización, envíos, aprobación comercial y flujos B2B más robustos.
            </p>
          </div>
        </div>
      </section>

      <section id="catalogo" className="mx-auto max-w-7xl px-6 pb-16">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
              Catálogo
            </p>
            <h3 className="mt-2 text-3xl font-bold tracking-tight">
              Productos destacados
            </h3>
          </div>

          <div className="text-sm text-slate-500">
            {featuredProducts.length} productos destacados
          </div>
        </div>

        {!featuredProducts.length ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <p className="text-lg font-semibold">No hay productos disponibles todavía.</p>
            <p className="mt-2 text-slate-500">
              Cuando publiques productos en Medusa, aparecerán aquí automáticamente.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {featuredProducts.map((product: any) => {
              const image = product.thumbnail || product.images?.[0]?.url || ""
              const price =
                product.variants?.[0]?.calculated_price?.calculated_amount
              const currency =
                product.variants?.[0]?.calculated_price?.currency_code?.toUpperCase()

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
                    <h4 className="line-clamp-2 min-h-[3.4rem] text-base font-semibold">
                      {product.title}
                    </h4>

                    {product.subtitle ? (
                      <p className="mt-2 line-clamp-2 text-sm text-slate-500">
                        {product.subtitle}
                      </p>
                    ) : (
                      <p className="mt-2 text-sm text-slate-400">
                        Producto disponible en catálogo B2B.
                      </p>
                    )}

                    <div className="mt-4">
                      {customer && typeof price === "number" ? (
                        <p className="text-lg font-bold text-slate-900">
                          {new Intl.NumberFormat("es-CO", {
                            style: "currency",
                            currency: currency || "COP",
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

                      <button
                        disabled
                        className="inline-flex rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-500"
                      >
                        B2B
                      </button>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
                Proceso comercial
              </p>
              <h3 className="mt-3 text-3xl font-bold tracking-tight">
                ¿Quieres comprar al por mayor con Movitec Games?
              </h3>
              <p className="mt-4 max-w-2xl text-slate-600">
                Para habilitar una cuenta comercial, revisamos previamente la
                documentación de tu tienda, validamos tu perfil y luego activamos
                el acceso a condiciones y precios B2B.
              </p>
            </div>

            <div className="rounded-3xl bg-slate-950 p-8 text-white">
              <h4 className="text-xl font-semibold">Qué debes enviar</h4>
              <ul className="mt-4 space-y-3 text-sm text-slate-300">
                <li>• Cámara de Comercio</li>
                <li>• RUT actualizado</li>
                <li>• Datos del contacto comercial</li>
                <li>• Información sobre retenciones</li>
              </ul>

              <div id="contacto" className="mt-6 space-y-3 text-sm">
                <p>
                  <span className="font-semibold">Correo:</span> ventas@movitecgames.com
                </p>
                <p>
                  <span className="font-semibold">Canal:</span> Atención comercial B2B
                </p>
              </div>

              <div className="mt-6">
                <Link
                  href="/solicitar-acceso"
                  className="inline-flex rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-slate-200"
                >
                  Solicitar acceso comercial
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="mx-auto max-w-7xl px-6 py-8 text-sm text-slate-500">
        © {new Date().getFullYear()} Movitec Games. Plataforma B2B en construcción.
      </footer>
    </main>
  )
}
