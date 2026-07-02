import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { medusa } from "../../../lib/medusa"
import ProductClient, {
  type ProductItem,
} from "../../../components/productos/ProductClient"

type ProductPageProps = {
  params: Promise<{ handle: string }>
}

async function getProductByHandle(handle: string): Promise<ProductItem | null> {
  try {
    const response = await medusa.store.product.list({
      handle,
      country_code: "co",
      fields:
        "*variants.calculated_price,+images,+variants.metadata,+variants.inventory_quantity,+variants.manage_inventory,+variants.allow_backorder",
    })

    return response.products?.[0] || null
  } catch (error) {
    console.error("Error cargando producto para SEO:", error)
    return null
  }
}

function buildDescription(product: ProductItem) {
  const baseDescription =
    product.description ||
    product.subtitle ||
    `${product.title} hace parte del catálogo B2B de Movitec Games, distribuidor de juegos de mesa modernos en español para tiendas y comercios especializados en Colombia.`

  return String(baseDescription).replace(/\s+/g, " ").trim().slice(0, 155)
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { handle } = await params
  const product = await getProductByHandle(handle)

  if (!product) {
    return {
      title: "Producto no encontrado",
      description:
        "Producto no encontrado en el catálogo B2B de Movitec Games.",
      robots: {
        index: false,
        follow: false,
      },
    }
  }

  const description = buildDescription(product)
  const image = product.thumbnail || product.images?.[0]?.url || undefined

  return {
    title: `${product.title} juego de mesa en Colombia`,
    description,
    alternates: {
      canonical: `/productos/${handle}`,
    },
    openGraph: {
      title: `${product.title} | Movitec Games`,
      description,
      url: `https://www.movitecgames.com/productos/${handle}`,
      type: "website",
      locale: "es_CO",
      images: image
        ? [
            {
              url: image,
              alt: `${product.title} juego de mesa moderno en Colombia`,
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.title} | Movitec Games`,
      description,
      images: image ? [image] : undefined,
    },
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { handle } = await params
  const product = await getProductByHandle(handle)

  if (!product) {
    notFound()
  }

  const image = product.thumbnail || product.images?.[0]?.url || undefined
  const variant = product.variants?.[0]
  const inventoryQuantity =
    typeof variant?.inventory_quantity === "number"
      ? variant.inventory_quantity
      : undefined

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: buildDescription(product),
    image: image ? [image] : undefined,
    url: `https://www.movitecgames.com/productos/${handle}`,
    brand: {
      "@type": "Brand",
      name: "Movitec Games",
    },
    category: "Juegos de mesa modernos",
    offers: {
      "@type": "Offer",
      url: `https://www.movitecgames.com/productos/${handle}`,
      priceCurrency:
        variant?.calculated_price?.currency_code?.toUpperCase() || "COP",
      availability:
        typeof inventoryQuantity === "number" && inventoryQuantity <= 0
          ? "https://schema.org/OutOfStock"
          : "https://schema.org/InStock",
      seller: {
        "@type": "Organization",
        name: "Movitec Games",
      },
    },
  }

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Inicio",
        item: "https://www.movitecgames.com",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Productos",
        item: "https://www.movitecgames.com/productos",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: product.title,
        item: `https://www.movitecgames.com/productos/${handle}`,
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />
      <ProductClient initialProduct={product} />
    </>
  )
}