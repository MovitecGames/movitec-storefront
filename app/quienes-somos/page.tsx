import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Quiénes somos | Movitec Games",
  description:
    "Conoce Movitec Games, plataforma especializada en juegos de mesa modernos en Colombia para jugadores, familias, tiendas y comercios con acceso B2B.",
  alternates: {
    canonical: "/quienes-somos",
  },
  openGraph: {
    title: "Quiénes somos | Movitec Games",
    description:
      "Movitec Games conecta juegos de mesa modernos, tiendas y jugadores en Colombia mediante catálogo público y acceso comercial B2B.",
    url: "https://www.movitecgames.com/quienes-somos",
    type: "website",
    locale: "es_CO",
  },
}

export default function QuienesSomosPage() {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Movitec Games",
    legalName: "Comercializadora AETOS",
    url: "https://www.movitecgames.com",
    logo: "https://www.movitecgames.com/logos/movitec-games.jpg",
    description:
      "Movitec Games es una plataforma especializada en juegos de mesa modernos en Colombia, con catálogo público para jugadores y acceso comercial B2B para tiendas y comercios autorizados.",
    areaServed: {
      "@type": "Country",
      name: "Colombia",
    },
    knowsAbout: [
      "juegos de mesa modernos",
      "juegos de mesa en español",
      "distribución B2B",
      "juegos familiares",
      "party games",
      "juegos cooperativos",
      "juegos de estrategia",
      "juegos de mesa en Colombia",
    ],
  }

  return (
    <main className="min-h-screen bg-neutral-50 text-slate-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationSchema),
        }}
      />

      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4">
          <Link href="/" className="flex items-center gap-4">
            <img
              src="/logos/movitec-games.jpg"
              alt="Movitec Games juegos de mesa modernos en Colombia"
              className="h-16 w-auto max-w-[180px] object-contain"
            />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Quiénes somos
              </p>
              <p className="text-xl font-bold tracking-tight">
                Movitec Games
              </p>
            </div>
          </Link>

          <nav className="flex flex-wrap items-center gap-3">
            <Link
              href="/productos"
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Catálogo
            </Link>
            <Link
              href="/categorias"
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Categorías
            </Link>
            <Link
              href="/donde-comprar"
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Dónde comprar
            </Link>
            <Link
              href="/solicitar-acceso"
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Acceso comercial
            </Link>
          </nav>
        </div>
      </header>

      <section className="bg-gradient-to-b from-slate-950 to-slate-800 text-white">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.24em] text-amber-300">
            Juegos de mesa modernos · Colombia · Catálogo y distribución
          </p>

          <h1 className="max-w-5xl text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
            Somos Movitec Games: una plataforma para descubrir, vender y
            distribuir juegos de mesa modernos en Colombia
          </h1>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">
            Movitec Games conecta editoriales, tiendas y jugadores. Nuestro
            objetivo es ampliar el acceso a juegos de mesa modernos en español,
            ofreciendo un catálogo público para descubrir títulos y un canal B2B
            para tiendas y comercios autorizados.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/productos"
              className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-200"
            >
              Explorar catálogo
            </Link>

            <Link
              href="/donde-comprar"
              className="rounded-xl border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Dónde comprar
            </Link>

            <Link
              href="/solicitar-acceso"
              className="rounded-xl border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Solicitar acceso B2B
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-8 lg:grid-cols-3">
          <article className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
              Para jugadores
            </p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight">
              Descubrir juegos
            </h2>
            <p className="mt-4 leading-7 text-slate-600">
              El público final puede usar Movitec Games como una guía para
              explorar juegos, conocer editoriales, revisar categorías y
              encontrar dónde comprar los títulos disponibles.
            </p>
          </article>

          <article className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
              Para tiendas
            </p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight">
              Acceso comercial B2B
            </h2>
            <p className="mt-4 leading-7 text-slate-600">
              Las tiendas, librerías, clubes, cafés lúdicos y comercios
              especializados pueden solicitar acceso para consultar precios,
              disponibilidad y condiciones comerciales.
            </p>
          </article>

          <article className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
              Para el mercado
            </p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight">
              Más juegos modernos en Colombia
            </h2>
            <p className="mt-4 leading-7 text-slate-600">
              Queremos aportar al crecimiento del hobby en Colombia, haciendo
              más visible el catálogo de juegos modernos en español y apoyando
              a los comercios que los recomiendan y venden.
            </p>
          </article>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
              Nuestra función
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight">
              Un puente entre editoriales, tiendas y nuevos jugadores
            </h2>
          </div>

          <div className="space-y-5 text-base leading-8 text-slate-600">
            <p>
              Movitec Games nace como una plataforma especializada para ordenar,
              presentar y mover catálogo de juegos de mesa modernos en Colombia.
              La página no solo está pensada para tiendas: también busca ayudar
              al cliente final a descubrir títulos, entender categorías y saber
              dónde comprarlos.
            </p>

            <p>
              Para el canal comercial, Movitec Games funciona como una
              herramienta B2B. Las cuentas aprobadas pueden consultar precios,
              disponibilidad y condiciones comerciales. Para el público general,
              el catálogo se mantiene abierto como herramienta de descubrimiento.
            </p>

            <p>
              Esta separación permite cuidar el canal comercial, proteger las
              condiciones B2B y, al mismo tiempo, darle visibilidad a los juegos
              para que más personas los conozcan y los pidan en tiendas.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
            Movitec Games y Tienda Movitec
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight">
            Dos enfoques relacionados, pero no iguales
          </h2>

          <div className="mt-8 grid gap-8 lg:grid-cols-2">
            <article className="rounded-3xl border border-slate-200 bg-neutral-50 p-6">
              <h3 className="text-2xl font-bold tracking-tight">
                Movitec Games
              </h3>
              <p className="mt-4 leading-7 text-slate-600">
                Es la marca enfocada en catálogo especializado, distribución y
                atención al canal comercial B2B. Su plataforma permite que
                tiendas y comercios autorizados accedan a condiciones
                comerciales, mientras el público general puede explorar juegos y
                conocer dónde comprarlos.
              </p>
            </article>

            <article className="rounded-3xl border border-slate-200 bg-neutral-50 p-6">
              <h3 className="text-2xl font-bold tracking-tight">
                Tienda Movitec
              </h3>
              <p className="mt-4 leading-7 text-slate-600">
                Es el canal retail orientado al consumidor final. Funciona como
                punto de venta y experiencia directa para jugadores, familias y
                personas que quieren comprar juegos de mesa modernos para jugar,
                regalar o descubrir el hobby.
              </p>
            </article>
          </div>

          <p className="mt-8 max-w-4xl leading-8 text-slate-600">
            Esta diferencia es importante: Movitec Games ayuda a mover el
            catálogo en el mercado y Tienda Movitec atiende al cliente final
            desde el canal retail.
          </p>
        </div>
      </section>

      <section className="bg-neutral-50">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="mb-10">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
              Qué puedes hacer aquí
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight">
              Usa Movitec Games según lo que necesitas
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              href="/productos"
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                Catálogo
              </p>
              <h3 className="mt-3 text-xl font-bold tracking-tight">
                Explorar juegos
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Revisa títulos disponibles, información pública y productos del
                catálogo.
              </p>
            </Link>

            <Link
              href="/categorias"
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                Categorías
              </p>
              <h3 className="mt-3 text-xl font-bold tracking-tight">
                Elegir qué jugar
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Encuentra juegos familiares, party, cooperativos, estrategia y
                más.
              </p>
            </Link>

            <Link
              href="/donde-comprar"
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                Cliente final
              </p>
              <h3 className="mt-3 text-xl font-bold tracking-tight">
                Dónde comprar
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Consulta canales o puntos de venta para conseguir los juegos.
              </p>
            </Link>

            <Link
              href="/solicitar-acceso"
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                B2B
              </p>
              <h3 className="mt-3 text-xl font-bold tracking-tight">
                Solicitar acceso
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Pide revisión comercial para consultar condiciones B2B.
              </p>
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-slate-950 text-white">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-amber-300">
            Siguiente paso
          </p>
          <h2 className="mt-3 max-w-4xl text-3xl font-bold tracking-tight">
            Descubre juegos de mesa modernos o solicita acceso comercial
          </h2>
          <p className="mt-5 max-w-3xl leading-8 text-slate-300">
            Si eres jugador o cliente final, explora el catálogo y revisa dónde
            comprar. Si tienes una tienda o comercio especializado, solicita
            acceso para consultar condiciones comerciales.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/productos"
              className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-200"
            >
              Explorar catálogo
            </Link>
            <Link
              href="/donde-comprar"
              className="rounded-xl border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Dónde comprar
            </Link>
            <Link
              href="/solicitar-acceso"
              className="rounded-xl border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Acceso para tiendas
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}