import type { Metadata } from "next"
import { medusa } from "../../lib/medusa"
import ProductListClient, {
  type ProductListItem,
} from "../../components/productos/ProductListClient"

export const metadata: Metadata = {
  title: "Catálogo B2B de juegos de mesa modernos en Colombia",
  description:
    "Explora el catálogo B2B de Movitec Games: juegos de mesa modernos en español para tiendas, librerías, clubes y comercios especializados en Colombia.",
  alternates: {
    canonical: "/productos",
  },
  openGraph: {
    title: "Catálogo B2B de juegos de mesa modernos en Colombia | Movitec Games",
    description:
      "Catálogo de juegos de mesa modernos en español para tiendas y comercios especializados en Colombia.",
    url: "https://www.movitecgames.com/productos",
    type: "website",
    locale: "es_CO",
  },
}

async function getAllProducts(): Promise<ProductListItem[]> {
  try {
    const limit = 100
    let offset = 0
    let allProducts: ProductListItem[] = []
    let keepLoading = true

    while (keepLoading) {
      const response = await medusa.store.product.list({
        country_code: "co",
        limit,
        offset,
        fields:
          "*variants.calculated_price,+variants.inventory_quantity,+variants.manage_inventory,+variants.allow_backorder,+images,+tags,+type,+collection",
      })

      const pageProducts = response.products || []

      allProducts = [...allProducts, ...pageProducts]

      const totalCount =
        typeof response.count === "number" ? response.count : null

      if (totalCount !== null) {
        keepLoading = allProducts.length < totalCount
      } else {
        keepLoading = pageProducts.length === limit
      }

      offset += limit
    }

    return allProducts
  } catch (error) {
    console.error("Error cargando catálogo para SEO:", error)
    return []
  }
}

export default async function ProductsPage() {
  const products = await getAllProducts()

  const catalogSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Catálogo B2B de juegos de mesa modernos en Colombia",
    description:
      "Catálogo B2B de Movitec Games con juegos de mesa modernos en español para tiendas y comercios especializados en Colombia.",
    url: "https://www.movitecgames.com/productos",
    isPartOf: {
      "@type": "WebSite",
      name: "Movitec Games",
      url: "https://www.movitecgames.com",
    },
    about: [
      "juegos de mesa modernos",
      "juegos de mesa en Colombia",
      "distribución B2B",
      "juegos familiares",
      "party games",
      "juegos cooperativos",
      "juegos de estrategia",
    ],
  }

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Productos del catálogo Movitec Games",
    itemListElement: products
      .filter((product) => Boolean(product.handle))
      .slice(0, 100)
      .map((product, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: product.title,
        url: `https://www.movitecgames.com/productos/${product.handle}`,
      })),
  }

  return (
    <>
      <section className="sr-only">
        <h1>Catálogo B2B de juegos de mesa modernos en Colombia</h1>
        <p>
          Movitec Games distribuye juegos de mesa modernos en español para
          tiendas, librerías, clubes y comercios especializados en Colombia.
          En esta sección puedes explorar el catálogo público de productos,
          editoriales y características. Los precios comerciales están
          disponibles únicamente para clientes autorizados.
        </p>
        <p>
          El catálogo incluye juegos familiares, party games, juegos
          cooperativos, juegos de estrategia, juegos infantiles, juegos de
          cartas, solitarios y títulos de iniciación para nuevos jugadores.
        </p>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(catalogSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(itemListSchema),
        }}
      />

      <ProductListClient initialProducts={products} />
    </>
  )
}