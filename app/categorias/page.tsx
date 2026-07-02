import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Categorías de juegos de mesa modernos en Colombia",
  description:
    "Explora categorías de juegos de mesa modernos: familiares, party games, cooperativos, estrategia, cartas, infantiles, solitarios y juegos por número de jugadores.",
  alternates: {
    canonical: "/categorias",
  },
  openGraph: {
    title: "Categorías de juegos de mesa modernos | Movitec Games",
    description:
      "Guía de categorías para descubrir juegos de mesa modernos en Colombia y explorar el catálogo de Movitec Games.",
    url: "https://www.movitecgames.com/categorias",
    type: "website",
    locale: "es_CO",
  },
}

const mainCategories = [
  {
    name: "Juegos familiares",
    description:
      "Ideales para compartir en casa, explicar rápidamente y jugar con personas de distintas edades o niveles de experiencia.",
    examples:
      "Recomendados para familias, nuevos jugadores, regalos y tiendas que buscan títulos fáciles de recomendar.",
    search: "Familiar",
  },
  {
    name: "Party games",
    description:
      "Juegos sociales, rápidos y con alta interacción. Funcionan muy bien en reuniones, eventos, grupos grandes y momentos casuales.",
    examples:
      "Recomendados para grupos de amigos, celebraciones, actividades comerciales y vitrinas de alta rotación.",
    search: "Party",
  },
  {
    name: "Juegos cooperativos",
    description:
      "Experiencias donde los jugadores trabajan juntos para superar un reto común. Todos ganan o pierden como equipo.",
    examples:
      "Recomendados para familias, grupos nuevos, clubes, colegios, empresas y jugadores que prefieren colaborar.",
    search: "Cooperativo",
  },
  {
    name: "Juegos de estrategia",
    description:
      "Títulos con mayor toma de decisiones, planificación y profundidad. Son ideales para jugadores que buscan partidas más retadoras.",
    examples:
      "Recomendados para jugadores intermedios, clubes, tiendas especializadas y comunidades con mayor experiencia.",
    search: "Estrategia",
  },
  {
    name: "Juegos de cartas",
    description:
      "Juegos compactos, fáciles de transportar y normalmente con partidas ágiles. Pueden ser familiares, party, tácticos o estratégicos.",
    examples:
      "Recomendados para vitrinas pequeñas, regalos, viajes, demostraciones rápidas y compras de impulso.",
    search: "Cartas",
  },
  {
    name: "Juegos infantiles",
    description:
      "Títulos pensados para niños, familias y primeros acercamientos al juego de mesa moderno.",
    examples:
      "Recomendados para familias, colegios, ludotecas, tiendas con público infantil y actividades de aprendizaje.",
    search: "Infantil",
  },
  {
    name: "Juegos solitarios",
    description:
      "Juegos que permiten jugar en solitario o que incluyen modo para una persona, sin depender de un grupo.",
    examples:
      "Recomendados para jugadores que buscan retos personales, tiendas con clientes especializados y públicos de nicho.",
    search: "Solitario",
  },
  {
    name: "Juegos abstractos",
    description:
      "Juegos centrados en mecánicas, patrones, lógica y decisiones limpias, muchas veces con poca dependencia del tema.",
    examples:
      "Recomendados para jugadores que disfrutan retos mentales, partidas elegantes y experiencias estratégicas directas.",
    search: "Abstracto",
  },
]

const playerCategories = [
  {
    name: "Juegos para 1 a 4 jugadores",
    description:
      "Opciones versátiles para jugar en solitario, en pareja o en grupos pequeños.",
    search: "1 a 4 jugadores",
  },
  {
    name: "Juegos para 2 a 5 jugadores",
    description:
      "Formato muy útil para familias, parejas, grupos pequeños y mesas casuales.",
    search: "2 a 5 jugadores",
  },
  {
    name: "Juegos para 3 a 8 jugadores",
    description:
      "Ideales para grupos medianos, reuniones y experiencias sociales con más interacción.",
    search: "3 a 8 jugadores",
  },
  {
    name: "Juegos para 4 a 10 jugadores",
    description:
      "Pensados para grupos grandes, fiestas, actividades comerciales y eventos.",
    search: "4 a 10 jugadores",
  },
]

export default function CategoriasPage() {
  const categorySchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Categorías de juegos de mesa modernos en Colombia",
    description:
      "Guía de categorías de juegos de mesa modernos para jugadores, familias, tiendas y comercios especializados en Colombia.",
    url: "https://www.movitecgames.com/categorias",
    isPartOf: {
      "@type": "WebSite",
      name: "Movitec Games",
      url: "https://www.movitecgames.com",
    },
    about: [
      "juegos familiares",
      "party games",
      "juegos cooperativos",
      "juegos de estrategia",
      "juegos de cartas",
      "juegos infantiles",
      "juegos solitarios",
      "juegos de mesa modernos",
      "juegos de mesa en Colombia",
    ],
  }

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Categorías de juegos de mesa modernos",
    itemListElement: [...mainCategories, ...playerCategories].map(
      (category, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: category.name,
        url: "https://www.movitecgames.com/categorias",
      })
    ),
  }

  return (
    <main className="min-h-screen bg-neutral-50 text-slate-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(categorySchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(itemListSchema),
        }}
      />

      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4">
          <Link href="/" className="flex items-center gap-4">
            <img
              src="/logos/movitec-games.jpg"
              alt="Movitec Games categorías de juegos de mesa modernos en Colombia"
              className="h-16 w-auto max-w-[180px] object-contain"
            />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Categorías
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
              href="/editoriales"
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Editoriales
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
            Categorías · Juegos de mesa modernos · Colombia
          </p>

          <h1 className="max-w-5xl text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
            Categorías de juegos de mesa modernos para descubrir, vender y jugar
          </h1>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">
            Explora los juegos de mesa modernos por tipo de experiencia:
            familiares, party, cooperativos, estrategia, cartas, infantiles,
            solitarios, abstractos y opciones por número de jugadores. Esta guía
            ayuda al público final a elegir qué jugar y a las tiendas a organizar
            mejor su oferta comercial.
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
        <div className="mb-10">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
            Tipos de juegos
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight">
            Encuentra juegos por experiencia
          </h2>
          <p className="mt-4 max-w-4xl leading-8 text-slate-600">
            Cada categoría ayuda a entender mejor qué tipo de juego puede
            funcionar para una familia, una reunión, una tienda, una vitrina, un
            club o un grupo de jugadores.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {mainCategories.map((category) => (
            <article
              key={category.name}
              className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm"
            >
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                Categoría
              </p>
              <h3 className="mt-3 text-2xl font-bold tracking-tight">
                {category.name}
              </h3>

              <p className="mt-4 leading-7 text-slate-600">
                {category.description}
              </p>

              <p className="mt-4 leading-7 text-slate-600">
                {category.examples}
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href={`/productos?buscar=${encodeURIComponent(
                    category.search
                  )}`}
                  className="inline-flex rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  Ver juegos de esta categoría
                </Link>

                <Link
                  href="/donde-comprar"
                  className="inline-flex rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Dónde comprar
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="mb-10">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
              Por número de jugadores
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight">
              Busca juegos según el tamaño de tu mesa
            </h2>
            <p className="mt-4 max-w-4xl leading-8 text-slate-600">
              El número de jugadores es una de las formas más sencillas de
              escoger un juego. También ayuda a las tiendas a recomendar títulos
              según el tipo de cliente o grupo.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {playerCategories.map((category) => (
              <article
                key={category.name}
                className="rounded-3xl border border-slate-200 bg-neutral-50 p-6"
              >
                <h3 className="text-xl font-bold tracking-tight">
                  {category.name}
                </h3>
                <p className="mt-3 leading-7 text-slate-600">
                  {category.description}
                </p>

                <div className="mt-6">
                  <Link
                    href={`/productos?buscar=${encodeURIComponent(
                      category.search
                    )}`}
                    className="inline-flex rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
                  >
                    Ver juegos
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
            Para cliente final y para tiendas
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight">
            Una guía para elegir mejor y vender mejor
          </h2>

          <div className="mt-6 grid gap-8 lg:grid-cols-2">
            <div>
              <h3 className="text-xl font-bold tracking-tight">
                Soy jugador o cliente final
              </h3>
              <p className="mt-3 leading-7 text-slate-600">
                Puedes usar estas categorías para entender qué tipo de juego se
                adapta mejor a tu grupo, edad, experiencia o momento. Después
                puedes explorar el catálogo y consultar Dónde comprar.
              </p>
              <div className="mt-6">
                <Link
                  href="/donde-comprar"
                  className="inline-flex rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  Ver dónde comprar
                </Link>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold tracking-tight">
                Tengo una tienda o negocio
              </h3>
              <p className="mt-3 leading-7 text-slate-600">
                Puedes usar las categorías para organizar recomendaciones,
                vitrinas, pedidos, reposiciones y surtido según el perfil de tus
                clientes. Las condiciones B2B se habilitan únicamente a clientes
                aprobados.
              </p>
              <div className="mt-6">
                <Link
                  href="/solicitar-acceso"
                  className="inline-flex rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  Solicitar acceso comercial
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-950 text-white">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-amber-300">
            Explora el catálogo
          </p>
          <h2 className="mt-3 max-w-4xl text-3xl font-bold tracking-tight">
            Encuentra juegos de mesa modernos por categoría, editorial o número
            de jugadores
          </h2>
          <p className="mt-5 max-w-3xl leading-8 text-slate-300">
            El catálogo público permite descubrir juegos. Las tiendas aprobadas
            pueden consultar precios y condiciones comerciales dentro de la
            plataforma B2B.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/productos"
              className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-200"
            >
              Explorar catálogo
            </Link>
            <Link
              href="/editoriales"
              className="rounded-xl border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Ver editoriales
            </Link>
            <Link
              href="/preguntas-frecuentes"
              className="rounded-xl border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Preguntas frecuentes
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}