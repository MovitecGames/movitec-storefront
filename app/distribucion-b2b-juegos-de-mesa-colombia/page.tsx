import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title:
    "Juegos de mesa modernos en Colombia | Distribución B2B y dónde comprar",
  description:
    "Movitec Games es una plataforma especializada en juegos de mesa modernos en Colombia: catálogo público para descubrir juegos y canal B2B para tiendas y comercios autorizados.",
  alternates: {
    canonical: "/distribucion-b2b-juegos-de-mesa-colombia",
  },
  openGraph: {
    title: "Juegos de mesa modernos en Colombia | Movitec Games",
    description:
      "Explora juegos de mesa modernos en español, encuentra dónde comprarlos y accede al canal B2B si tienes una tienda o comercio especializado.",
    url: "https://www.movitecgames.com/distribucion-b2b-juegos-de-mesa-colombia",
    type: "website",
    locale: "es_CO",
  },
}

export default function DistribucionB2BPage() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "¿Qué es Movitec Games?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Movitec Games es una plataforma especializada en juegos de mesa modernos en Colombia. Funciona como catálogo público para jugadores y familias, y como canal B2B para tiendas, librerías, clubes, cafés lúdicos y comercios autorizados.",
        },
      },
      {
        "@type": "Question",
        name: "¿Movitec Games vende directamente al público final?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Movitec Games está orientado principalmente al canal comercial B2B. El público general puede explorar el catálogo, conocer los juegos y consultar dónde comprarlos a través de tiendas aliadas o canales retail disponibles.",
        },
      },
      {
        "@type": "Question",
        name: "¿Dónde puedo comprar los juegos si soy cliente final?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Si eres cliente final, puedes explorar el catálogo de Movitec Games y luego consultar la sección Dónde comprar para encontrar puntos de venta, tiendas aliadas o canales retail disponibles.",
        },
      },
      {
        "@type": "Question",
        name: "¿Quién puede solicitar acceso comercial B2B?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Pueden solicitar acceso comercial tiendas, librerías, clubes, cafés lúdicos y comercios especializados interesados en comprar juegos de mesa modernos para reventa o circulación comercial.",
        },
      },
      {
        "@type": "Question",
        name: "¿Los precios B2B son públicos?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No. El catálogo puede explorarse públicamente, pero los precios y condiciones comerciales se muestran únicamente a clientes autorizados por Movitec Games.",
        },
      },
    ],
  }

  return (
    <main className="min-h-screen bg-neutral-50 text-slate-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqSchema),
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
                Juegos de mesa modernos
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
              Ver catálogo
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
              Solicitar acceso comercial
            </Link>
          </nav>
        </div>
      </header>

      <section className="bg-gradient-to-b from-slate-950 to-slate-800 text-white">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.24em] text-amber-300">
            Juegos de mesa modernos · Colombia · Tiendas y jugadores
          </p>

          <h1 className="max-w-5xl text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
            Juegos de mesa modernos en Colombia: distribución B2B y catálogo
            para descubrir dónde comprar
          </h1>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">
            Movitec Games conecta editoriales, tiendas y jugadores. Somos una
            plataforma especializada en juegos de mesa modernos en español: las
            tiendas pueden acceder a condiciones comerciales B2B, y el público
            general puede explorar el catálogo, conocer títulos disponibles y
            encontrar dónde comprarlos en Colombia.
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
              Para jugadores y familias
            </p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight">
              Descubre qué jugar
            </h2>
            <p className="mt-4 leading-7 text-slate-600">
              Explora juegos de mesa modernos por nombre, editorial, número de
              jugadores, tipo de experiencia y características. El catálogo
              público ayuda a conocer nuevos títulos antes de buscarlos en
              tiendas o puntos de venta.
            </p>
          </article>

          <article className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
              Para tiendas y comercios
            </p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight">
              Canal B2B especializado
            </h2>
            <p className="mt-4 leading-7 text-slate-600">
              Las tiendas aprobadas pueden consultar precios, disponibilidad y
              condiciones comerciales dentro de la plataforma. El acceso se
              habilita después de revisión comercial.
            </p>
          </article>

          <article className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
              Para el mercado colombiano
            </p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight">
              Juegos modernos en español
            </h2>
            <p className="mt-4 leading-7 text-slate-600">
              Movitec Games trabaja con juegos de mesa modernos en español,
              pensados para facilitar la entrada de nuevos jugadores y ampliar
              la oferta disponible en Colombia.
            </p>
          </article>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
              Qué hacemos
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight">
              Una plataforma para explorar, recomendar, vender y comprar juegos
              de mesa modernos en Colombia
            </h2>
          </div>

          <div className="space-y-5 text-base leading-8 text-slate-600">
            <p>
              Movitec Games está diseñado como una plataforma especializada en
              juegos de mesa modernos. Para tiendas y comercios, funciona como
              canal B2B; para jugadores, familias y clientes finales, funciona
              como catálogo de consulta para descubrir juegos y saber dónde
              comprarlos.
            </p>

            <p>
              El catálogo incluye juegos familiares, party games, cooperativos,
              estrategia, cartas, aventura, infantiles, abstractos, solitarios y
              juegos para distintos números de jugadores.
            </p>

            <p>
              El público general puede explorar el catálogo, conocer juegos por
              editorial, categoría, número de jugadores y tipo de experiencia, y
              luego consultar los puntos de venta disponibles en la sección
              Dónde comprar.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
            Catálogo y editoriales
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight">
            Un catálogo para tiendas, jugadores y nuevos públicos
          </h2>

          <p className="mt-5 max-w-4xl leading-8 text-slate-600">
            Movitec Games reúne un catálogo especializado de juegos de mesa
            modernos en español, con presencia de editoriales como 2Tomatoes,
            SD Games, Tranjis Games, Arrakis Games, Delirium Games, Más Que Oca,
            Bumblebee, Megacorpin Games y Salt & Pepper Games, según
            disponibilidad y condiciones comerciales vigentes.
          </p>

          <p className="mt-5 max-w-4xl leading-8 text-slate-600">
            El objetivo es que las tiendas tengan una herramienta comercial para
            seleccionar productos y que el público final tenga una guía clara
            para descubrir juegos, compararlos y saber dónde comprarlos.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            {[
              "2Tomatoes",
              "SD Games",
              "Tranjis Games",
              "Arrakis Games",
              "Delirium Games",
              "Más Que Oca",
              "Bumblebee",
              "Megacorpin Games",
              "Salt & Pepper Games",
            ].map((name) => (
              <span
                key={name}
                className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700"
              >
                {name}
              </span>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/productos"
              className="inline-flex rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Ver catálogo completo
            </Link>

            <Link
              href="/donde-comprar"
              className="inline-flex rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Consultar dónde comprar
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-neutral-50">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
              Dos formas de usar Movitec Games
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight">
              Catálogo abierto, condiciones comerciales restringidas
            </h2>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            <article className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <h3 className="text-2xl font-bold tracking-tight">
                Soy jugador o cliente final
              </h3>
              <p className="mt-4 leading-7 text-slate-600">
                Puedes revisar juegos, leer información del producto, explorar
                editoriales y usar el catálogo como guía para elegir qué jugar.
                Si un título te interesa, puedes ir a la sección Dónde comprar
                para ubicar puntos de venta o canales disponibles.
              </p>
              <div className="mt-6">
                <Link
                  href="/donde-comprar"
                  className="inline-flex rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  Ver dónde comprar
                </Link>
              </div>
            </article>

            <article className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <h3 className="text-2xl font-bold tracking-tight">
                Tengo una tienda o negocio
              </h3>
              <p className="mt-4 leading-7 text-slate-600">
                Puedes solicitar acceso comercial para que revisemos tu perfil.
                Una vez aprobado, podrás ingresar a la plataforma y consultar
                precios, disponibilidad y condiciones B2B para realizar pedidos
                comerciales.
              </p>
              <div className="mt-6">
                <Link
                  href="/solicitar-acceso"
                  className="inline-flex rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  Solicitar acceso comercial
                </Link>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="bg-slate-950 text-white">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-amber-300">
            Explora el catálogo
          </p>
          <h2 className="mt-3 max-w-4xl text-3xl font-bold tracking-tight">
            Encuentra juegos de mesa modernos para vender, recomendar o jugar
          </h2>
          <p className="mt-5 max-w-3xl leading-8 text-slate-300">
            Si eres tienda, solicita acceso comercial. Si eres jugador o cliente
            final, explora el catálogo y consulta dónde comprar los títulos
            disponibles.
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