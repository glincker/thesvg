import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ThemeProvider } from "@/components/theme-provider";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
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
  description: `Search, copy, and ship ${count}+ brand SVG icons. Free, open-source library with npm packages, React components, CLI, CDN, and MCP server. Tree-shakeable, typed, zero config.`,
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
  ],
  metadataBase: new URL("https://thesvg.org"),
  openGraph: {
    title: `theSVG - ${count}+ Free Brand SVG Icons for Developers and Designers`,
    description: `Search, copy, and ship ${count}+ brand SVG icons. Free, open-source library with npm packages, React components, CLI, CDN, and MCP server for AI assistants.`,
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
    description: `Search, copy, and ship ${count}+ brand SVG icons. Free, open-source library with npm packages, React components, CLI, CDN, and MCP server for AI assistants.`,
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/icon.svg",
    apple: "/apple-touch-icon.png",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          storageKey="thesvg-theme"
          disableTransitionOnChange
        >
          <Header />
          <main className="min-h-[calc(100vh-3.75rem)]">{children}</main>
          <Footer />
          <Analytics />
          <SpeedInsights />
        </ThemeProvider>
      </body>
    </html>
  );
}
