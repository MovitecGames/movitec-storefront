import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Preguntas frecuentes sobre juegos de mesa modernos en Colombia",
  description:
    "Resuelve dudas sobre Movitec Games, juegos de mesa modernos, dónde comprar, catálogo público y acceso B2B para tiendas y comercios especializados.",
  alternates: {
    canonical: "/preguntas-frecuentes",
  },
  openGraph: {
    title: "Preguntas frecuentes | Movitec Games",
    description:
      "Preguntas frecuentes para jugadores, familias, tiendas y comercios interesados en juegos de mesa modernos en Colombia.",
    url: "https://www.movitecgames.com/preguntas-frecuentes",
    type: "website",
    locale: "es_CO",
  },
}

const finalCustomerFaqs = [
  {
    question: "¿Movitec Games vende directamente al público final?",
    answer:
      "Movitec Games está orientado principalmente al canal comercial B2B. Sin embargo, el público final puede explorar el catálogo, conocer los juegos disponibles y consultar dónde comprarlos a través de tiendas aliadas o canales retail.",
  },
  {
    question: "¿Dónde puedo comprar los juegos de mesa que aparecen en el catálogo?",
    answer:
      "Si eres jugador, familia o cliente final, puedes revisar el catálogo público y luego ingresar a la sección Dónde comprar para encontrar puntos de venta, tiendas aliadas o canales disponibles.",
  },
  {
    question: "¿Puedo usar el catálogo aunque no tenga una cuenta comercial?",
    answer:
      "Sí. El catálogo público está disponible para descubrir juegos, revisar títulos, editoriales, categorías y características. Los precios comerciales solo están visibles para clientes B2B autorizados.",
  },
  {
    question: "¿Cómo puedo elegir un juego de mesa moderno?",
    answer:
      "Puedes empezar revisando la cantidad de jugadores, el tipo de experiencia y la duración aproximada. Algunos juegos son familiares, otros son party, cooperativos, de estrategia, infantiles, de cartas o para jugar en solitario.",
  },
  {
    question: "¿Qué es un juego familiar?",
    answer:
      "Un juego familiar es un título pensado para ser accesible, fácil de explicar y disfrutable por personas con distintos niveles de experiencia. Suele funcionar bien para familias, grupos casuales o personas que están entrando al mundo de los juegos de mesa modernos.",
  },
  {
    question: "¿Qué es un party game?",
    answer:
      "Un party game es un juego pensado para grupos, reuniones y momentos sociales. Normalmente tiene reglas sencillas, partidas rápidas y mucha interacción entre jugadores.",
  },
  {
    question: "¿Qué es un juego cooperativo?",
    answer:
      "Un juego cooperativo es aquel en el que los jugadores no compiten entre sí, sino que trabajan juntos para superar un reto común. Todos ganan o pierden como equipo.",
  },
  {
    question: "¿Qué es un juego de estrategia?",
    answer:
      "Un juego de estrategia suele exigir más planificación, toma de decisiones y lectura de la partida. Puede ser ideal para jugadores que buscan una experiencia más profunda o retadora.",
  },
]

const b2bFaqs = [
  {
    question: "¿Qué es Movitec Games?",
    answer:
      "Movitec Games es una plataforma especializada en juegos de mesa modernos en Colombia. Funciona como catálogo público para jugadores y como canal B2B para tiendas, librerías, clubes, cafés lúdicos y comercios autorizados.",
  },
  {
    question: "¿Quién puede solicitar acceso comercial B2B?",
    answer:
      "Pueden solicitar acceso comercial tiendas, librerías, clubes, cafés lúdicos, comercios especializados y negocios que quieran comprar juegos de mesa modernos para reventa, recomendación o circulación comercial.",
  },
  {
    question: "¿Los precios B2B son públicos?",
    answer:
      "No. Los precios, descuentos y condiciones comerciales están disponibles únicamente para clientes autorizados. El catálogo sí puede explorarse públicamente.",
  },
  {
    question: "¿Cómo solicito acceso comercial?",
    answer:
      "Debes ingresar a la sección Solicitar acceso comercial y completar la información requerida. Movitec Games revisará el perfil del negocio antes de habilitar precios y condiciones B2B.",
  },
  {
    question: "¿Qué tipo de productos distribuye Movitec Games?",
    answer:
      "Movitec Games trabaja con juegos de mesa modernos en español, incluyendo juegos familiares, party games, cooperativos, estrategia, infantiles, cartas, aventura, abstractos, solitarios y títulos de iniciación.",
  },
  {
    question: "¿El catálogo muestra disponibilidad?",
    answer:
      "Sí. La plataforma puede mostrar estados como disponible, pocas unidades o agotado temporalmente, según la información de inventario configurada en el catálogo.",
  },
  {
    question: "¿Puedo comprar si mi cuenta aún está en revisión?",
    answer:
      "No. Una cuenta en revisión puede explorar la plataforma, pero los precios y condiciones comerciales se habilitan únicamente cuando el perfil comercial ha sido aprobado.",
  },
  {
    question: "¿Movitec Games es lo mismo que Tienda Movitec?",
    answer:
      "No. Tienda Movitec es el canal retail orientado al consumidor final. Movitec Games es la marca enfocada en distribución, catálogo especializado y atención al canal comercial B2B.",
  },
]

export default function PreguntasFrecuentesPage() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [...finalCustomerFaqs, ...b2bFaqs].map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
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
                Preguntas frecuentes
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
              Acceso comercial
            </Link>
          </nav>
        </div>
      </header>

      <section className="bg-gradient-to-b from-slate-950 to-slate-800 text-white">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.24em] text-amber-300">
            Juegos de mesa modernos · Colombia · B2B y cliente final
          </p>

          <h1 className="max-w-5xl text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
            Preguntas frecuentes sobre juegos de mesa modernos, catálogo y
            acceso B2B
          </h1>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">
            Resolvemos dudas para dos públicos: jugadores, familias y clientes
            finales que quieren descubrir juegos de mesa modernos; y tiendas,
            librerías, clubes o comercios que buscan acceso comercial B2B con
            Movitec Games.
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
        <div className="grid gap-8 lg:grid-cols-2">
          <article className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
              Soy jugador o cliente final
            </p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight">
              Quiero descubrir juegos y saber dónde comprarlos
            </h2>
            <p className="mt-4 leading-7 text-slate-600">
              Puedes explorar el catálogo público de Movitec Games para conocer
              juegos de mesa modernos, revisar títulos por editorial, tipo de
              experiencia o número de jugadores, y luego consultar la sección
              Dónde comprar.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/productos"
                className="inline-flex rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Ver catálogo
              </Link>
              <Link
                href="/donde-comprar"
                className="inline-flex rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Dónde comprar
              </Link>
            </div>
          </article>

          <article className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
              Tengo tienda o negocio
            </p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight">
              Quiero acceder a condiciones comerciales B2B
            </h2>
            <p className="mt-4 leading-7 text-slate-600">
              Si tienes una tienda, librería, club, café lúdico o comercio
              especializado, puedes solicitar acceso comercial para que Movitec
              Games revise tu perfil y habilite precios y condiciones B2B.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/solicitar-acceso"
                className="inline-flex rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Solicitar acceso comercial
              </Link>
              <Link
                href="/distribucion-b2b-juegos-de-mesa-colombia"
                className="inline-flex rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Conocer Movitec Games
              </Link>
            </div>
          </article>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="mb-10">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
              Para jugadores y familias
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight">
              Preguntas sobre juegos, catálogo y dónde comprar
            </h2>
          </div>

          <div className="space-y-4">
            {finalCustomerFaqs.map((item) => (
              <article
                key={item.question}
                className="rounded-3xl border border-slate-200 bg-neutral-50 p-6"
              >
                <h3 className="text-xl font-bold tracking-tight">
                  {item.question}
                </h3>
                <p className="mt-3 leading-7 text-slate-600">{item.answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-10">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
            Para tiendas y canal comercial
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight">
            Preguntas sobre acceso B2B, precios y condiciones comerciales
          </h2>
        </div>

        <div className="space-y-4">
          {b2bFaqs.map((item) => (
            <article
              key={item.question}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <h3 className="text-xl font-bold tracking-tight">
                {item.question}
              </h3>
              <p className="mt-3 leading-7 text-slate-600">{item.answer}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-slate-950 text-white">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-amber-300">
            Siguiente paso
          </p>
          <h2 className="mt-3 max-w-4xl text-3xl font-bold tracking-tight">
            Explora juegos de mesa modernos o solicita acceso comercial
          </h2>
          <p className="mt-5 max-w-3xl leading-8 text-slate-300">
            El catálogo público ayuda al cliente final a descubrir juegos y
            saber dónde comprarlos. Las tiendas y comercios pueden solicitar
            acceso para consultar condiciones B2B.
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