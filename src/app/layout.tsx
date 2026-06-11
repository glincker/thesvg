import { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ScrollToTop } from "@/components/scroll-to-top";
import { MobileShell } from "@/components/mobile/mobile-shell";
import { getFormattedIconCount } from "@/lib/icons";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const count = getFormattedIconCount();

export const metadata: Metadata = {
  title: {
    default: `theSVG - ${count}+ Free Brand SVG Icons for Developers and Designers`,
    template: "%s | theSVG",
  },
  description: `Search, copy, and ship ${count}+ brand SVG icons. Open-source library with npm, React, Vue, Svelte, CLI, CDN, and MCP server support.`,
  keywords: [
    "svg",
    "brand icons",
    "logo",
    "svg library",
    "open source",
    "brand assets",
    "svg icons",
    "brand logos",
    "icon library",
    "free icons",
    "svg download",
    "brand svg",
    "official brand icons",
    "brand logo svg download",
    "svg brand library",
    "free svg icons",
    "company logo svg",
    "tech brand icons",
    "simple icons alternative",
    "svg logo collection",
  ],
  metadataBase: new URL("https://thesvg.org"),
  openGraph: {
    title: `theSVG - ${count}+ Free Brand SVG Icons for Developers and Designers`,
    description: `Search, copy, and ship ${count}+ brand SVG icons. Open-source library with npm, React, Vue, Svelte, CLI, CDN, and MCP server support.`,
    url: "https://thesvg.org",
    siteName: "theSVG",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: `theSVG - ${count}+ brand SVG icons for developers`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `theSVG - ${count}+ Free Brand SVG Icons for Developers and Designers`,
    description: `Search, copy, and ship ${count}+ brand SVG icons. Open-source library with npm, React, Vue, Svelte, CLI, CDN, and MCP server support.`,
    images: ["/og-image.png"],
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-dark.svg", type: "image/svg+xml", media: "(prefers-color-scheme: dark)" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  category: "technology",
  creator: "GLINCKER",
  publisher: "theSVG",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  alternates: {
    types: {
      "application/rss+xml": "https://thesvg.org/feed.xml",
    },
  },
  appleWebApp: {
    capable: true,
    title: "theSVG",
    statusBarStyle: "black-translucent",
  },
};

// Mobile-friendly viewport so the layout uses the full notched area,
// scales correctly at common phone widths (360 - 430), and still allows
// the user to zoom for accessibility (no maximum-scale lockdown).
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="search" type="application/opensearchdescription+xml" title="theSVG" href="/opensearch.xml" />
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-1VSDVTDKDR"
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-1VSDVTDKDR');
          `}
        </Script>
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          storageKey="thesvg-theme"
          disableTransitionOnChange
        >
          <ScrollToTop />
          {/* Desktop header — `lg:` and above. Below that the MobileShell
              renders its own top bar + bottom dock to deliver an app-like
              feel without touching desktop chrome. */}
          <div className="hidden lg:block">
            <Suspense>
              <Header />
            </Suspense>
          </div>
          <Suspense>
            <MobileShell>
              <main className="min-h-[calc(100dvh-3rem)] lg:min-h-[calc(100dvh-3.75rem)]">
                {children}
              </main>
              <Footer />
            </MobileShell>
          </Suspense>
        </ThemeProvider>
      </body>
    </html>
  );
}
