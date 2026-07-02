import type { MetadataRoute } from "next"
import { medusa } from "../lib/medusa"

type SitemapProduct = {
  handle?: string | null
  updated_at?: string | null
  created_at?: string | null
}

async function getAllProductRoutes(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://www.movitecgames.com"

  try {
    const limit = 100
    let offset = 0
    let allProducts: SitemapProduct[] = []
    let keepLoading = true

    while (keepLoading) {
      const response = await medusa.store.product.list({
        country_code: "co",
        limit,
        offset,
        fields: "handle,updated_at,created_at",
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
      .filter((product) => Boolean(product.handle))
      .map((product) => ({
        url: `${baseUrl}/productos/${product.handle}`,
        lastModified: product.updated_at
          ? new Date(product.updated_at)
          : product.created_at
          ? new Date(product.created_at)
          : new Date(),
        changeFrequency: "weekly",
        priority: 0.7,
      }))
  } catch (error) {
    console.error("Error generando sitemap de productos:", error)

    try {
      const response = await medusa.store.product.list({
        country_code: "co",
        limit: 200,
      })

      return (response.products || [])
        .filter((product: SitemapProduct) => Boolean(product.handle))
        .map((product: SitemapProduct) => ({
          url: `${baseUrl}/productos/${product.handle}`,
          lastModified: product.updated_at
            ? new Date(product.updated_at)
            : product.created_at
            ? new Date(product.created_at)
            : new Date(),
          changeFrequency: "weekly",
          priority: 0.7,
        }))
    } catch (fallbackError) {
      console.error("Error generando sitemap fallback de productos:", fallbackError)
      return []
    }
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://www.movitecgames.com"

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/productos`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.95,
    },
    {
      url: `${baseUrl}/categorias`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/editoriales`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/quienes-somos`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/distribucion-b2b-juegos-de-mesa-colombia`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/preguntas-frecuentes`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.85,
    },
    {
      url: `${baseUrl}/donde-comprar`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/solicitar-acceso`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.75,
    },
  ]

  const productRoutes = await getAllProductRoutes()

  return [...staticRoutes, ...productRoutes]
}