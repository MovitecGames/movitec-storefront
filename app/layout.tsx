import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.movitecgames.com"),
  title: {
    default: "Movitec Games | Distribuidor B2B de juegos de mesa modernos en Colombia",
    template: "%s | Movitec Games",
  },
  description:
    "Movitec Games es una plataforma B2B para tiendas, librerías, clubes y comercios especializados que buscan juegos de mesa modernos en español en Colombia.",
  keywords: [
    "Movitec Games",
    "juegos de mesa modernos Colombia",
    "distribuidor de juegos de mesa Colombia",
    "juegos de mesa al por mayor Colombia",
    "B2B juegos de mesa",
    "proveedor de juegos de mesa",
    "juegos de mesa para tiendas",
    "juegos de mesa en español",
    "2Tomatoes Colombia",
    "SD Games Colombia",
    "Tranjis Games Colombia",
    "Arrakis Games Colombia",
    "Delirium Games Colombia",
  ],
  authors: [{ name: "Movitec Games" }],
  creator: "Movitec Games",
  publisher: "Movitec Games",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Movitec Games | Distribuidor B2B de juegos de mesa modernos en Colombia",
    description:
      "Catálogo B2B de juegos de mesa modernos en español para tiendas, librerías, clubes y comercios especializados en Colombia.",
    url: "https://www.movitecgames.com",
    siteName: "Movitec Games",
    locale: "es_CO",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Movitec Games | Distribuidor B2B de juegos de mesa modernos en Colombia",
    description:
      "Catálogo B2B de juegos de mesa modernos en español para tiendas y comercios especializados en Colombia.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Movitec Games",
    legalName: "Comercializadora AETOS",
    url: "https://www.movitecgames.com",
    logo: "https://www.movitecgames.com/logos/movitec-games.jpg",
    description:
      "Distribuidor B2B de juegos de mesa modernos en español para tiendas y comercios especializados en Colombia.",
    areaServed: {
      "@type": "Country",
      name: "Colombia",
    },
    knowsAbout: [
      "juegos de mesa modernos",
      "distribución B2B",
      "juegos de mesa en español",
      "juegos familiares",
      "party games",
      "juegos cooperativos",
      "juegos de estrategia",
      "juegos para tiendas",
    ],
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Movitec Games",
    url: "https://www.movitecgames.com",
    description:
      "Catálogo B2B de juegos de mesa modernos en español para tiendas y comercios especializados en Colombia.",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://www.movitecgames.com/productos?buscar={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <html
      lang="es-CO"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteSchema),
          }}
        />
        {children}
      </body>
    </html>
  );
}