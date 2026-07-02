import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Editoriales de juegos de mesa modernos en Colombia",
  description:
    "Conoce las editoriales presentes en el catálogo de Movitec Games: 2Tomatoes, SD Games, Tranjis Games, Arrakis Games, Delirium Games y otros sellos de juegos de mesa modernos en español.",
  alternates: {
    canonical: "/editoriales",
  },
  openGraph: {
    title: "Editoriales de juegos de mesa modernos | Movitec Games",
    description:
      "Explora editoriales de juegos de mesa modernos en español presentes en el catálogo de Movitec Games para tiendas y jugadores en Colombia.",
    url: "https://www.movitecgames.com/editoriales",
    type: "website",
    locale: "es_CO",
  },
}

const featuredPublishers = [
  {
    name: "2Tomatoes",
    logo: "/logos/2tomatoes.jpg",
    description:
      "Editorial reconocida por juegos modernos en español con títulos familiares, narrativos, estratégicos y de alta recordación dentro del hobby.",
    href: "/productos",
  },
  {
    name: "SD Games",
    logo: "/logos/sd-games.png",
    description:
      "Sello con juegos de mesa modernos en español, títulos familiares, experiencias accesibles y propuestas para públicos diversos.",
    href: "/productos",
  },
  {
    name: "Tranjis Games",
    logo: "/logos/tranjis-games.png",
    description:
      "Editorial con fuerte presencia en juegos party, familiares y de interacción social, ideales para tiendas que buscan títulos fáciles de recomendar.",
    href: "/productos",
  },
  {
    name: "Arrakis Games",
    logo: "/logos/arrakis-games.png",
    description:
      "Editorial con propuestas modernas para jugadores que buscan experiencias de estrategia, aventura y catálogo especializado en español.",
    href: "/productos",
  },
  {
    name: "Delirium Games",
    logo: "/logos/delirium-games.jpg",
    description:
      "Sello con juegos modernos en español para diferentes perfiles de jugadores, desde experiencias familiares hasta propuestas más estratégicas.",
    href: "/productos",
  },
]

const additionalPublishers = [
  {
    name: "Más Que Oca",
    logo: "/logos/mas-que-oca.png",
  },
  {
    name: "Bumblebee",
    logo: "/logos/bumblebee.jpg",
  },
  {
    name: "Megacorpin Games",
    logo: "/logos/megacorpin-games.png",
  },
  {
    name: "Salt & Pepper Games",
    logo: "/logos/salt-and-pepper-games.png",
  },
]

export default function EditorialesPage() {
  const publishersSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Editoriales de juegos de mesa modernos en Colombia",
    description:
      "Editoriales presentes en el catálogo de Movitec Games, plataforma especializada en juegos de mesa modernos en español para tiendas, jugadores y comercios en Colombia.",
    url: "https://www.movitecgames.com/editoriales",
    isPartOf: {
      "@type": "WebSite",
      name: "Movitec Games",
      url: "https://www.movitecgames.com",
    },
    about: [
      "2Tomatoes",
      "SD Games",
      "Tranjis Games",
      "Arrakis Games",
      "Delirium Games",
      "juegos de mesa modernos",
      "juegos de mesa en español",
      "juegos de mesa en Colombia",
    ],
  }

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Editoriales presentes en Movitec Games",
    itemListElement: [...featuredPublishers, ...additionalPublishers].map(
      (publisher, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: publisher.name,
        url: "https://www.movitecgames.com/editoriales",
      })
    ),
  }

  return (
    <main className="min-h-screen bg-neutral-50 text-slate-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(publishersSchema),
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
              alt="Movitec Games editorial y catálogo de juegos de mesa modernos en Colombia"
              className="h-16 w-auto max-w-[180px] object-contain"
            />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Editoriales
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
            Editoriales · Juegos de mesa modernos · Colombia
          </p>

          <h1 className="max-w-5xl text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
            Editoriales de juegos de mesa modernos presentes en Movitec Games
          </h1>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">
            Movitec Games reúne un catálogo especializado de juegos de mesa
            modernos en español para tiendas, librerías, clubes, comercios y
            jugadores en Colombia. Aquí puedes conocer algunas de las
            editoriales presentes en nuestro catálogo.
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
            Editoriales destacadas
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight">
            Catálogo especializado para tiendas y jugadores
          </h2>
          <p className="mt-4 max-w-4xl leading-8 text-slate-600">
            Estas editoriales hacen parte del corazón del catálogo que Movitec
            Games trabaja para el mercado colombiano. La disponibilidad de
            títulos puede variar según inventario, lanzamientos, reposiciones y
            condiciones comerciales vigentes.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {featuredPublishers.map((publisher) => (
            <article
              key={publisher.name}
              className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm"
            >
              <div className="flex flex-wrap items-center gap-5">
                <div className="flex h-24 w-40 items-center justify-center rounded-2xl border border-slate-200 bg-white p-4">
                  <img
                    src={publisher.logo}
                    alt={`${publisher.name} juegos de mesa modernos en Colombia`}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>

                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Editorial
                  </p>
                  <h3 className="mt-2 text-2xl font-bold tracking-tight">
                    {publisher.name}
                  </h3>
                </div>
              </div>

              <p className="mt-6 leading-7 text-slate-600">
                {publisher.description}
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href={publisher.href}
                  className="inline-flex rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  Ver juegos en catálogo
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
              También presentes en catálogo
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight">
              Otros sellos y editoriales disponibles según catálogo
            </h2>
            <p className="mt-4 max-w-4xl leading-8 text-slate-600">
              Además de las editoriales destacadas, Movitec Games puede contar
              con otros sellos dentro del catálogo, de acuerdo con la
              disponibilidad, inventario y condiciones comerciales vigentes.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {additionalPublishers.map((publisher) => (
              <article
                key={publisher.name}
                className="rounded-3xl border border-slate-200 bg-neutral-50 p-6 text-center"
              >
                <div className="mx-auto flex h-24 items-center justify-center rounded-2xl bg-white p-4">
                  <img
                    src={publisher.logo}
                    alt={`${publisher.name} editorial de juegos de mesa`}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <h3 className="mt-5 text-lg font-bold tracking-tight">
                  {publisher.name}
                </h3>
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
            Una página para descubrir editoriales y encontrar juegos
          </h2>

          <div className="mt-6 grid gap-8 lg:grid-cols-2">
            <div>
              <h3 className="text-xl font-bold tracking-tight">
                Soy jugador o cliente final
              </h3>
              <p className="mt-3 leading-7 text-slate-600">
                Puedes usar esta página para conocer editoriales, descubrir
                juegos de mesa modernos y luego consultar el catálogo o la
                sección Dónde comprar para encontrar canales disponibles.
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
                Puedes solicitar acceso comercial para revisar precios,
                disponibilidad y condiciones B2B dentro de la plataforma de
                Movitec Games.
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
            Explora por editorial
          </p>
          <h2 className="mt-3 max-w-4xl text-3xl font-bold tracking-tight">
            Encuentra juegos de mesa modernos por sello, experiencia y tipo de jugador
          </h2>
          <p className="mt-5 max-w-3xl leading-8 text-slate-300">
            Revisa el catálogo de Movitec Games para descubrir títulos
            familiares, party, cooperativos, de estrategia, cartas, aventura,
            infantiles, abstractos y más.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/productos"
              className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-200"
            >
              Explorar catálogo
            </Link>
            <Link
              href="/preguntas-frecuentes"
              className="rounded-xl border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Preguntas frecuentes
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