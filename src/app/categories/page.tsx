import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Shapes } from "lucide-react";
import {
  getCategoryCounts,
  getCollections,
  getIconsByCategory,
} from "@/lib/icons";
import { SidebarShell } from "@/components/layout/sidebar-shell";

export const metadata: Metadata = {
  title: "Browse All Categories",
  description:
    "Explore all icon categories on theSVG. Browse 5,880+ brand, AWS, Azure, and GCP SVG icons organized by category.",
  keywords: [
    "SVG icon categories",
    "brand icon categories",
    "AWS icon categories",
    "Azure icon categories",
    "GCP icon categories",
    "icon browser",
    "browse SVG icons",
  ],
  openGraph: {
    title: "Browse All Categories | theSVG",
    description: "Explore all icon categories on theSVG.",
    siteName: "theSVG",
  },
  alternates: { canonical: "https://thesvg.org/categories" },
};

function CategoryCard({
  name,
  count,
  href,
  sampleIcons,
}: {
  name: string;
  count: number;
  href: string;
  sampleIcons: { slug: string; src: string }[];
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col gap-3 rounded-xl border border-border/40 bg-card/50 p-4 transition-all hover:border-border hover:bg-card hover:shadow-md dark:border-white/[0.06] dark:bg-white/[0.02] dark:hover:border-white/[0.1] dark:hover:bg-white/[0.04]"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground">{name}</span>
        <span className="rounded-full bg-muted/60 px-2 py-0.5 font-mono text-[10px] text-muted-foreground dark:bg-white/[0.04]">
          {count}
        </span>
      </div>
      {sampleIcons.length > 0 && (
        <div className="flex items-center gap-1.5">
          {sampleIcons.map((icon) => (
            <img
              key={icon.slug}
              src={icon.src}
              alt=""
              width={20}
              height={20}
              className="h-5 w-5 object-contain"
              loading="lazy"
            />
          ))}
        </div>
      )}
    </Link>
  );
}

export default function CategoriesPage() {
  const allCategoryCounts = getCategoryCounts();
  const collections = getCollections();
  const brandCategories = getCategoryCounts("brands");
  const awsCategories = getCategoryCounts("aws");

  const totalCategories = brandCategories.length + awsCategories.length;

  // Build sample icons for each category (up to 6 per category)
  const samplesByCategory = new Map<string, { slug: string; src: string }[]>();
  for (const cat of [...brandCategories, ...awsCategories]) {
    if (!samplesByCategory.has(cat.name)) {
      const icons = getIconsByCategory(cat.name).slice(0, 6);
      samplesByCategory.set(
        cat.name,
        icons.map((i) => ({
          slug: i.slug,
          src: i.variants.default,
        }))
      );
    }
  }

  return (
    <Suspense>
      <SidebarShell categoryCounts={allCategoryCounts} collections={collections}>
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
          {/* Header */}
          <div className="mb-8">
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-border/40 bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground dark:border-white/[0.08] dark:bg-white/[0.04]">
              <Shapes className="h-3 w-3" />
              {totalCategories} categories
            </div>
            <h1 className="mb-2 text-2xl font-bold tracking-tight sm:text-3xl">
              All Categories
            </h1>
            <p className="max-w-lg text-sm text-muted-foreground sm:text-base">
              Browse all icon categories across brand and AWS architecture collections.
            </p>
          </div>

          {/* Brand Icon Categories */}
          {brandCategories.length > 0 && (
            <section className="mb-10">
              <div className="mb-4 flex items-center gap-2">
                <h2 className="text-sm font-semibold text-foreground">
                  Brand Icon Categories
                </h2>
                <span className="text-xs text-muted-foreground">
                  {brandCategories.length}
                </span>
                <div className="h-px flex-1 bg-border/40 dark:bg-white/[0.04]" />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {brandCategories.map((cat) => (
                  <CategoryCard
                    key={`brands-${cat.name}`}
                    name={cat.name}
                    count={cat.count}
                    href={`/?category=${encodeURIComponent(cat.name)}`}
                    sampleIcons={samplesByCategory.get(cat.name) || []}
                  />
                ))}
              </div>
            </section>
          )}

          {/* AWS Architecture Categories */}
          {awsCategories.length > 0 && (
            <section>
              <div className="mb-4 flex items-center gap-2">
                <h2 className="text-sm font-semibold text-foreground">
                  AWS Architecture Categories
                </h2>
                <span className="text-xs text-muted-foreground">
                  {awsCategories.length}
                </span>
                <div className="h-px flex-1 bg-border/40 dark:bg-white/[0.04]" />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {awsCategories.map((cat) => (
                  <CategoryCard
                    key={`aws-${cat.name}`}
                    name={cat.name}
                    count={cat.count}
                    href={`/?category=${encodeURIComponent(cat.name)}&collection=aws`}
                    sampleIcons={samplesByCategory.get(cat.name) || []}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      </SidebarShell>
    </Suspense>
  );
}
