import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { JsonLd } from "@/components/json-ld";
import { SidebarShell } from "@/components/layout/sidebar-shell";
import { BrowseSuspense } from "@/components/skeletons";
import { getFamilyMembers, getFamilySlugs } from "@/lib/families";
import { getCategoryCounts, getCollectionCount, getIconBySlug } from "@/lib/icons";
import type { Collection, IconEntry } from "@/lib/icons";
import { categoryUrl } from "@/lib/categories";
import { getJsDelivrUrl } from "@/components/icons/shared/icon-constants";

export const dynamic = "force-static";
export const dynamicParams = false;

/** Architecture collections that belong with a family, shown as one link. */
const FAMILY_COLLECTIONS: Record<string, { collection: Collection; label: string }> = {
  amazon: { collection: "aws", label: "AWS architecture icons" },
  google: { collection: "gcp", label: "Google Cloud architecture icons" },
};

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getFamilySlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const parent = getIconBySlug(slug);
  if (!parent || !getFamilySlugs().includes(slug)) return {};
  const count = getFamilyMembers(slug).length;
  const title = `${parent.title} family SVG logos (${count} icons)`;
  const description = `All ${parent.title} brand marks in one place: ${count} official SVG logos and variants. Copy as SVG, JSX, React or a CDN link.`;
  return {
    title,
    description,
    alternates: { canonical: `https://thesvg.org/family/${slug}` },
    openGraph: {
      title: `${title} | theSVG`,
      description,
      url: `https://thesvg.org/family/${slug}`,
      type: "website",
      siteName: "theSVG",
      images: [{ url: "/og-image.png", width: 1200, height: 630, alt: title }],
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

function groupByCategory(icons: IconEntry[]): [string, IconEntry[]][] {
  const groups = new Map<string, IconEntry[]>();
  for (const icon of icons) {
    const key = icon.categories[0] ?? "Other";
    const list = groups.get(key) ?? [];
    list.push(icon);
    groups.set(key, list);
  }
  return [...groups].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]));
}

export default async function FamilyPage({ params }: PageProps) {
  const { slug } = await params;
  const parent = getIconBySlug(slug);
  if (!parent || !getFamilySlugs().includes(slug)) notFound();

  const members = getFamilyMembers(slug);
  const children = members.filter((m) => m.slug !== slug);
  const groups = groupByCategory(children);
  const extra = FAMILY_COLLECTIONS[slug];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${parent.title} family SVG logos`,
    url: `https://thesvg.org/family/${slug}`,
    isPartOf: { "@type": "WebSite", name: "theSVG", url: "https://thesvg.org" },
    about: { "@type": "Organization", name: parent.title, url: parent.url },
    numberOfItems: members.length,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: members.slice(0, 50).map((icon, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: icon.title,
        url: `https://thesvg.org/icon/${icon.slug}`,
        image: getJsDelivrUrl(icon.slug, "default"),
      })),
    },
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <BrowseSuspense>
        <SidebarShell categoryCounts={getCategoryCounts()}>
          <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
            <header className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="icon-preview-bg flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl p-4 shadow-sm">
                <img
                  src={parent.variants.default}
                  alt={parent.title}
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Brand family
                </p>
                <h1 className="text-3xl font-bold tracking-tight">
                  {parent.title}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {members.length} official logos across {groups.length}{" "}
                  {groups.length === 1 ? "category" : "categories"}.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href={`/icon/${slug}`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground shadow-sm transition-colors hover:bg-accent"
                  >
                    {parent.title} main logo
                    <ArrowUpRight className="h-3 w-3 opacity-50" />
                  </Link>
                  {extra && (
                    <Link
                      href={`/collection/${extra.collection}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm transition-colors hover:bg-accent hover:text-foreground"
                    >
                      {extra.label} ({getCollectionCount(extra.collection)})
                      <ArrowUpRight className="h-3 w-3 opacity-50" />
                    </Link>
                  )}
                </div>
              </div>
            </header>

            <div className="mt-10 space-y-10">
              {groups.map(([category, icons]) => (
                <section key={category} aria-labelledby={`fam-${category}`}>
                  <div className="mb-3 flex items-center justify-between">
                    <h2
                      id={`fam-${category}`}
                      className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                    >
                      {category}
                      <span className="ml-2 font-normal text-muted-foreground/60">
                        {icons.length}
                      </span>
                    </h2>
                    <Link
                      href={categoryUrl(category)}
                      className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                      All {category}
                      <ArrowUpRight className="h-3 w-3" />
                    </Link>
                  </div>
                  <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
                    {icons.map((icon) => (
                      <li key={icon.slug}>
                        <Link
                          href={`/icon/${icon.slug}`}
                          prefetch={false}
                          className="group flex flex-col items-center gap-1.5 rounded-xl border border-border bg-card p-2.5 shadow-sm transition-all hover:border-foreground/20 hover:bg-accent hover:shadow-md"
                        >
                          <div className="icon-preview-bg flex h-12 w-12 items-center justify-center rounded-lg p-1.5">
                            <img
                              src={icon.variants.default}
                              alt=""
                              loading="lazy"
                              className="h-full w-full object-contain"
                            />
                          </div>
                          <span className="line-clamp-1 w-full text-center text-[10px] font-medium text-muted-foreground transition-colors group-hover:text-foreground">
                            {icon.title}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </div>
        </SidebarShell>
      </BrowseSuspense>
    </>
  );
}
