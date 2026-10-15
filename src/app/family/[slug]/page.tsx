import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { JsonLd } from "@/components/json-ld";
import { SidebarShell } from "@/components/layout/sidebar-shell";
import { BrowseSuspense } from "@/components/skeletons";
import {
  FAMILY_GROUPING_MIN,
  FAMILY_SECTION_RULES,
  getFamilyMembers,
  getFamilySlugs,
} from "@/lib/families";
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

/** Tiles shown before a section collapses the rest behind a toggle. */
const VISIBLE_TILES = 12;

/** Sections up to this size are shown in full: hiding a few tiles is worse than none. */
const COLLAPSE_ABOVE = 18;

/** A category earns its own section only with at least this many icons. */
const MIN_SECTION_SIZE = 5;

interface Section {
  title: string;
  /** Category to link to, or null for the catch-all section. */
  category: string | null;
  icons: IconEntry[];
}

/**
 * Splits members into sections. Small families render as one continuous
 * grid; large ones get a section per sizeable category, with the leftovers
 * gathered into a final catch-all so no section is a sparse row.
 */
function buildSections(
  icons: IconEntry[],
  familyTitle: string,
  familySlug: string,
): Section[] {
  const rules = FAMILY_SECTION_RULES[familySlug];
  if (rules && icons.length >= FAMILY_GROUPING_MIN) {
    const buckets = rules.map<Section>((r) => ({
      title: r.title,
      category: null,
      icons: [],
    }));
    const rest: IconEntry[] = [];
    for (const icon of icons) {
      const idx = rules.findIndex((r) => r.match.test(icon.slug));
      if (idx === -1) rest.push(icon);
      else buckets[idx].icons.push(icon);
    }
    const out = buckets.filter((b) => b.icons.length > 0);
    if (rest.length > 0) {
      out.push({ title: `More from ${familyTitle}`, category: null, icons: rest });
    }
    return out;
  }
  if (icons.length < MIN_SECTION_SIZE * 3) {
    return [{ title: `All ${familyTitle} logos`, category: null, icons }];
  }
  const groups = new Map<string, IconEntry[]>();
  for (const icon of icons) {
    const key = icon.categories[0] ?? "Other";
    const list = groups.get(key) ?? [];
    list.push(icon);
    groups.set(key, list);
  }
  const big: Section[] = [];
  const rest: IconEntry[] = [];
  for (const [category, list] of groups) {
    if (list.length >= MIN_SECTION_SIZE) {
      big.push({ title: category, category, icons: list });
    } else {
      rest.push(...list);
    }
  }
  big.sort((a, b) => b.icons.length - a.icons.length || a.title.localeCompare(b.title));
  if (rest.length > 0) {
    rest.sort((a, b) => a.title.localeCompare(b.title));
    big.push({ title: `More from ${familyTitle}`, category: null, icons: rest });
  }
  return big;
}

function IconTileGrid({
  icons,
  className,
}: {
  icons: IconEntry[];
  className?: string;
}) {
  return (
    <ul
      className={`grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 ${className ?? ""}`}
    >
      {icons.map((icon) => (
        <li key={icon.slug}>
          <Link
            href={`/icon/${icon.slug}`}
            prefetch={false}
            className="group flex h-full flex-col items-center gap-2 rounded-2xl border border-border bg-card p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:border-foreground/20 hover:bg-accent hover:shadow-md"
          >
            <div className="icon-preview-bg flex h-20 w-full items-center justify-center rounded-xl p-3">
              <img
                src={icon.variants.default}
                alt=""
                loading="lazy"
                className="h-full w-full object-contain"
              />
            </div>
            <span className="line-clamp-1 w-full text-center text-xs font-semibold text-foreground">
              {icon.title}
            </span>
            <span className="-mt-1.5 line-clamp-1 w-full text-center text-[10px] text-muted-foreground">
              {icon.categories[0]}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default async function FamilyPage({ params }: PageProps) {
  const { slug } = await params;
  const parent = getIconBySlug(slug);
  if (!parent || !getFamilySlugs().includes(slug)) notFound();

  const members = getFamilyMembers(slug);
  const children = members.filter((m) => m.slug !== slug);
  const sections = buildSections(children, parent.title, slug);
  const categoryCount = new Set(children.map((c) => c.categories[0])).size;
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
              <div className="icon-preview-bg flex h-28 w-28 shrink-0 items-center justify-center rounded-2xl p-5 shadow-sm">
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
                  {members.length} official logos across {categoryCount}{" "}
                  {categoryCount === 1 ? "category" : "categories"}.
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
              {sections.map((section) => (
                <section key={section.title} aria-labelledby={`fam-${section.title}`}>
                  <div className="mb-3 flex items-center justify-between">
                    <h2
                      id={`fam-${section.title}`}
                      className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                    >
                      {section.title}
                      <span className="ml-2 font-normal text-muted-foreground/60">
                        {section.icons.length}
                      </span>
                    </h2>
                    {section.category && (
                      <Link
                        href={categoryUrl(section.category)}
                        className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                      >
                        All {section.category}
                        <ArrowUpRight className="h-3 w-3" />
                      </Link>
                    )}
                  </div>
                  <IconTileGrid
                    icons={
                      section.icons.length > COLLAPSE_ABOVE
                        ? section.icons.slice(0, VISIBLE_TILES)
                        : section.icons
                    }
                  />
                  {section.icons.length > COLLAPSE_ABOVE && (
                    <details className="group/more mt-3">
                      <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm transition-colors hover:bg-accent hover:text-foreground [&::-webkit-details-marker]:hidden group-open/more:hidden">
                        Show {section.icons.length - VISIBLE_TILES} more
                      </summary>
                      <IconTileGrid
                        icons={section.icons.slice(VISIBLE_TILES)}
                        className="mt-3"
                      />
                    </details>
                  )}
                </section>
              ))}
            </div>
          </div>
        </SidebarShell>
      </BrowseSuspense>
    </>
  );
}
