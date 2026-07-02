import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/productos",
          "/donde-comprar",
          "/solicitar-acceso",
        ],
        disallow: [
          "/admin",
          "/api",
          "/carrito",
          "/checkout",
          "/cuenta",
          "/login",
          "/register",
          "/recuperar-contrasena",
          "/restablecer-contrasena",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: [
          "/admin",
          "/api",
          "/carrito",
          "/checkout",
          "/cuenta",
          "/login",
          "/register",
          "/recuperar-contrasena",
          "/restablecer-contrasena",
        ],
      },
      {
        userAgent: "OAI-SearchBot",
        allow: "/",
        disallow: [
          "/admin",
          "/api",
          "/carrito",
          "/checkout",
          "/cuenta",
          "/login",
          "/register",
          "/recuperar-contrasena",
          "/restablecer-contrasena",
        ],
      },
      {
        userAgent: "GPTBot",
        allow: "/",
        disallow: [
          "/admin",
          "/api",
          "/carrito",
          "/checkout",
          "/cuenta",
          "/login",
          "/register",
          "/recuperar-contrasena",
          "/restablecer-contrasena",
        ],
      },
    ],
    sitemap: "https://www.movitecgames.com/sitemap.xml",
  };
}