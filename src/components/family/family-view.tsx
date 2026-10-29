import Link from "next/link";
import type { CSSProperties } from "react";
import { ArrowUpRight, BookOpen, LayoutGrid, Plus } from "@/components/own-icons";
import { withUtm } from "@/lib/external-link";
import type { IconEntry } from "@/lib/icons";
import type { OtherFamily } from "@/lib/families";
import { categoryUrl } from "@/lib/categories";
import { iconTone } from "@/lib/icon-tone";
import type { IconTone } from "@/lib/icon-tone";
import iconTones from "@/data/icon-tones.json";
import { cn } from "@/lib/utils";

export interface FamilySection {
  title: string;
  /** Category to link to, or null for curated or catch-all sections. */
  category: string | null;
  icons: IconEntry[];
}

interface FamilyViewProps {
  parent: IconEntry;
  tagline: string;
  accents: [string, string];
  showcase: IconEntry[];
  featured: IconEntry[];
  sections: FamilySection[];
  total: number;
  categoryCount: number;
  variantCount: number;
  extra: { href: string; label: string; icon: string | null } | null;
  others: OtherFamily[];
}

/** Tiles shown before a section collapses the rest behind a toggle. */
const VISIBLE_TILES = 12;
/** Sections up to this size show in full: hiding a few tiles is worse than none. */
const COLLAPSE_ABOVE = 18;

function slugId(title: string): string {
  return `fam-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

// Per-family and per-icon colors are runtime values (one set per brand),
// so they travel as CSS variables: the same narrow exception to the
// Tailwind-only rule the icon detail page uses for `--icon-tint`.
function accentStyle(a: string, b: string): CSSProperties {
  return { "--fam-a": a, "--fam-b": b } as CSSProperties;
}

function dotStyle(hex: string | undefined): CSSProperties | undefined {
  return hex ? ({ backgroundColor: `#${hex}` } as CSSProperties) : undefined;
}

function toneFor(icon: IconEntry): IconTone {
  return (
    (iconTones as Record<string, IconTone>)[icon.slug] ?? iconTone(icon.hex)
  );
}

/**
 * A logo that stays visible in both themes. Icons that ship light and dark
 * variants swap between them (same rule as the main grid). Single-variant
 * near-white marks sit on a soft tile with a shadow on the artwork, as on
 * the icon page; near-black marks get a light plate in dark mode only, so
 * light mode stays airy. No radial "contrast disc": it reads as a smudge
 * at this size.
 */
function Logo({
  icon,
  className,
  chip = true,
}: {
  icon: IconEntry;
  className?: string;
  chip?: boolean;
}) {
  const lightSrc = icon.variants.light || icon.variants.default;
  const darkSrc = icon.variants.dark || icon.variants.default;
  const swap = lightSrc !== darkSrc;
  const tone = swap ? "neutral" : toneFor(icon);
  const imgBase = "h-full w-full object-contain";
  return (
    <span
      className={cn(
        "flex items-center justify-center",
        chip && tone === "light" && "icon-preview-bg",
        chip && tone === "dark" && "dark:bg-neutral-200",
        className,
      )}
    >
      {swap ? (
        <>
          <img
            src={lightSrc}
            alt=""
            loading="lazy"
            className={cn(imgBase, "dark:hidden")}
          />
          <img
            src={darkSrc}
            alt=""
            loading="lazy"
            className={cn(imgBase, "hidden dark:block")}
          />
        </>
      ) : (
        <img
          src={icon.variants.default}
          alt=""
          loading="lazy"
          className={cn(
            imgBase,
            chip &&
              tone === "light" &&
              "drop-shadow-[0_1px_5px_rgba(0,0,0,0.5)]",
          )}
        />
      )}
    </span>
  );
}

/**
 * Stagger for entrance animations. The classes (`animate-fade-in-up`,
 * `animate-float-in`) already respect the global reduced-motion guard, so
 * the delay is the only runtime value; capped so a long list never waits.
 */
function enter(index: number, base = 0, step = 40, max = 14): CSSProperties {
  return { animationDelay: `${base + Math.min(index, max) * step}ms` };
}

function hostOf(url: string | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    return u.protocol === "https:" || u.protocol === "http:"
      ? u.hostname.replace(/^www\./, "")
      : null;
  } catch {
    return null;
  }
}

const PILL =
  "inline-flex min-h-9 items-center gap-2 rounded-xl border border-border bg-background/80 px-3 py-2 text-xs font-semibold shadow-sm backdrop-blur transition-colors hover:bg-accent";
const PILL_QUIET =
  "inline-flex min-h-9 items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground";

function variantTotal(icon: IconEntry): number {
  return Object.values(icon.variants).filter(Boolean).length;
}

function Hero({
  parent,
  tagline,
  accents,
  showcase,
  total,
  categoryCount,
  variantCount,
  extra,
}: Pick<
  FamilyViewProps,
  | "parent"
  | "tagline"
  | "accents"
  | "showcase"
  | "total"
  | "categoryCount"
  | "variantCount"
  | "extra"
>) {
  const siteHost = hostOf(parent.url);
  const githubHref =
    parent.links?.github && hostOf(parent.links.github)?.endsWith("github.com")
      ? parent.links.github
      : null;
  const stats = [
    { value: total, label: "logos" },
    { value: categoryCount, label: "categories" },
    { value: variantCount, label: "variants" },
  ];
  return (
    <header
      className="relative overflow-hidden rounded-[2rem] border border-border/60 bg-card"
      style={accentStyle(accents[0], accents[1])}
    >
      <div
        aria-hidden
        className="animate-glow-drift pointer-events-none absolute -inset-[20%] bg-[radial-gradient(50%_70%_at_14%_14%,color-mix(in_oklch,var(--fam-a)_22%,transparent),transparent_70%),radial-gradient(45%_65%_at_86%_86%,color-mix(in_oklch,var(--fam-b)_20%,transparent),transparent_70%)]"
      />
      <div className="relative grid gap-6 p-5 sm:gap-8 sm:p-10 lg:grid-cols-[1.1fr_1fr] lg:items-center">
        <div className="min-w-0">
          <span
            style={enter(0)}
            className="animate-fade-in-up inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground backdrop-blur"
          >
            <span
              className="h-1.5 w-1.5 rounded-full bg-[var(--fam-a)]"
              aria-hidden
            />
            {parent.title} · Brand family
          </span>
          <h1
            style={enter(2)}
            className="animate-fade-in-up mt-4 bg-gradient-to-br from-foreground via-foreground/85 to-[color-mix(in_oklch,var(--fam-a)_70%,var(--foreground))] bg-clip-text text-3xl font-semibold leading-[1.1] tracking-tight text-transparent sm:text-4xl lg:text-5xl"
          >
            {tagline}
          </h1>
          <dl
            style={enter(4)}
            className="animate-fade-in-up mt-5 flex flex-wrap gap-x-6 gap-y-1 sm:mt-6 sm:gap-x-8"
          >
            {stats.map((s) => (
              <div key={s.label} className="flex items-baseline gap-2">
                <dd className="text-2xl font-semibold tabular-nums text-foreground/90">
                  {s.value}
                </dd>
                <dt className="text-sm text-muted-foreground">{s.label}</dt>
              </div>
            ))}
          </dl>
          <div style={enter(6)} className="animate-fade-in-up mt-6 space-y-3">
            <div className="flex flex-wrap gap-2">
              <Link href={`/icon/${parent.slug}`} className={PILL}>
                <Logo icon={parent} chip={false} className="h-4 w-4" />
                {parent.title} main logo
                <ArrowUpRight className="h-3 w-3 opacity-50" />
              </Link>
              {extra && (
                <Link
                  href={extra.href}
                  className={`${PILL} text-muted-foreground hover:text-foreground`}
                >
                  {extra.icon && (
                    <img
                      src={extra.icon}
                      alt=""
                      className="h-4 w-4 object-contain"
                    />
                  )}
                  {extra.label}
                  <ArrowUpRight className="h-3 w-3 opacity-50" />
                </Link>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {siteHost && parent.url && (
                <a
                  href={withUtm(parent.url, "family_hero")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={PILL_QUIET}
                >
                  <img
                    src={`https://www.google.com/s2/favicons?domain=${siteHost}&sz=32`}
                    alt=""
                    width={16}
                    height={16}
                    className="h-4 w-4 rounded-sm"
                  />
                  {siteHost}
                  <ArrowUpRight className="h-3 w-3 opacity-50" />
                </a>
              )}
              {githubHref && (
                <a
                  href={withUtm(githubHref, "family_hero")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={PILL_QUIET}
                >
                  <img
                    src="/icons/github/mono.svg"
                    alt=""
                    width={16}
                    height={16}
                    className="h-4 w-4 dark:invert"
                  />
                  GitHub
                  <ArrowUpRight className="h-3 w-3 opacity-50" />
                </a>
              )}
              {parent.guidelines && (
                <a
                  href={withUtm(parent.guidelines, "family_hero")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={PILL_QUIET}
                >
                  <BookOpen className="h-4 w-4" aria-hidden />
                  Brand guidelines
                  <ArrowUpRight className="h-3 w-3 opacity-50" />
                </a>
              )}
              <Link href="/families" className={PILL_QUIET}>
                <LayoutGrid className="h-4 w-4" aria-hidden />
                All families
              </Link>
              <Link href="/submit" className={PILL_QUIET}>
                <Plus className="h-4 w-4" aria-hidden />
                Submit a missing {parent.title} logo
              </Link>
            </div>
          </div>
        </div>

        {showcase.length > 0 && (
          <div
            style={enter(3)}
            className="animate-fade-in-up rounded-3xl border border-border/60 bg-background/70 p-4 shadow-xl backdrop-blur sm:p-5"
          >
            <div className="mb-4 flex items-center justify-between text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              <span>Flagships</span>
              <Link
                href={`/icon/${parent.slug}`}
                className="inline-flex items-center gap-1 hover:text-foreground"
              >
                Open <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
            <ul className="grid grid-cols-4 gap-2 sm:gap-3">
              {showcase.slice(0, 4).map((icon, i) => (
                <li
                  key={icon.slug}
                  style={enter(i, 300, 70, 4)}
                  className="animate-float-in"
                >
                  <Link
                    href={`/icon/${icon.slug}`}
                    prefetch={false}
                    title={icon.title}
                    className="block aspect-square transition-transform hover:scale-110"
                  >
                    <Logo
                      icon={icon}
                      className="h-full w-full rounded-2xl p-2"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </header>
  );
}

function Tile({ icon, index }: { icon: IconEntry; index: number }) {
  return (
    <li style={enter(index, 120, 30, 16)} className="animate-fade-in-up">
      <Link
        href={`/icon/${icon.slug}`}
        prefetch={false}
        className="group flex h-full flex-col rounded-3xl border border-transparent p-3 transition-all hover:border-border hover:bg-card hover:shadow-md"
      >
        <Logo
          icon={icon}
          className="h-28 rounded-2xl p-4 transition-transform duration-200 group-hover:scale-105"
        />
        <span className="mt-2 flex items-center justify-between gap-2 px-1">
          <span className="min-w-0">
            <span className="block truncate text-[13px] font-medium text-foreground/90">
              {icon.title}
            </span>
            <span className="block truncate text-[11px] text-muted-foreground">
              {icon.categories[0]} · {variantTotal(icon)}{" "}
              {variantTotal(icon) === 1 ? "variant" : "variants"}
            </span>
          </span>
          <span
            aria-hidden
            className="h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-border/60"
            style={dotStyle(icon.hex)}
          />
        </span>
      </Link>
    </li>
  );
}

function TileGrid({
  icons,
  className,
}: {
  icons: IconEntry[];
  className?: string;
}) {
  return (
    <ul
      className={`grid grid-cols-2 gap-1 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 ${className ?? ""}`}
    >
      {icons.map((icon, i) => (
        <Tile key={icon.slug} icon={icon} index={i} />
      ))}
    </ul>
  );
}

function MoreFamilies({ others }: { others: OtherFamily[] }) {
  if (others.length === 0) return null;
  return (
    <section aria-labelledby="more-families" className="mt-16">
      <h2
        id="more-families"
        className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground"
      >
        More brand families
      </h2>
      <ul className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {others.map((f) => (
          <li key={f.slug} style={accentStyle(f.accents[0], f.accents[1])}>
            <Link
              href={`/family/${f.slug}`}
              className="group relative flex items-center justify-between gap-4 overflow-hidden rounded-3xl border border-border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_120%_at_0%_0%,color-mix(in_oklch,var(--fam-a)_16%,transparent),transparent_70%)]"
              />
              <span className="relative min-w-0">
                <span className="block truncate text-sm font-semibold">
                  {f.title}
                </span>
                <span className="block text-[11px] text-muted-foreground">
                  {f.count} logos
                </span>
              </span>
              <span className="relative flex items-center">
                {f.logos.map((src, i) => (
                  <span
                    key={src}
                    className="-ml-2 flex h-10 w-10 items-center justify-center rounded-xl border border-border/70 bg-background p-1.5 shadow-sm first:ml-0"
                    style={{ zIndex: f.logos.length - i }}
                  >
                    <img
                      src={src}
                      alt=""
                      className="h-full w-full object-contain"
                    />
                  </span>
                ))}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function FamilyView(props: FamilyViewProps) {
  const { parent, sections, others, featured } = props;
  // Featured products lead the full set so the page opens on what people
  // look for first; the rest follow in their groups.
  // ⚡ Bolt: Use a single-pass loop instead of `new Set(array.map(...))` to
  // avoid allocating intermediate arrays and reduce garbage collection pressure.
  const featuredSlugs = new Set<string>();
  for (const f of featured) {
    featuredSlugs.add(f.slug);
  }
  const grouped = sections
    .map((s) => ({
      ...s,
      icons: s.icons.filter((i) => !featuredSlugs.has(i.slug)),
    }))
    .filter((s) => s.icons.length > 0);
  const lead: FamilySection | null =
    featured.length > 0
      ? { title: "Flagship products", category: null, icons: featured }
      : null;
  const all = lead ? [lead, ...grouped] : grouped;

  return (
    <div className="mx-auto w-full max-w-7xl px-3 py-5 sm:px-6 sm:py-8">
      <Hero {...props} />

      <div className="mt-8 flex flex-wrap items-end justify-between gap-3 sm:mt-10">
        <h2 className="text-xl font-semibold tracking-tight text-foreground/80">
          The full set
          <span className="ml-3 text-sm font-normal text-muted-foreground">
            {props.total} icons
          </span>
        </h2>
        <Link
          href={`/icon/${parent.slug}`}
          className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold shadow-sm transition-colors hover:bg-accent"
        >
          All {parent.title} icons
          <ArrowUpRight className="h-3 w-3 opacity-50" />
        </Link>
      </div>

      {all.length > 1 && (
        <nav
          aria-label="Jump to a group"
          style={enter(8)}
          className="animate-fade-in-up mt-5 flex flex-wrap gap-2"
        >
          {all.map((s) => (
            <a
              key={s.title}
              href={`#${slugId(s.title)}`}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <span
                className="h-2 w-2 rounded-full bg-[var(--fam-a)]"
                aria-hidden
              />
              {s.title}
              <span className="font-mono text-[10px] opacity-60">
                {s.icons.length}
              </span>
            </a>
          ))}
        </nav>
      )}

      <div
        className="mt-8 space-y-12"
        style={accentStyle(props.accents[0], props.accents[1])}
      >
        {all.map((section) => (
          <section
            key={section.title}
            id={slugId(section.title)}
            aria-labelledby={`${slugId(section.title)}-h`}
            className="scroll-mt-24"
          >
            <div className="mb-2 flex items-center justify-between px-1">
              <h3
                id={`${slugId(section.title)}-h`}
                className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground"
              >
                {section.title}
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  {section.icons.length}
                </span>
              </h3>
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
            <TileGrid
              icons={
                section.icons.length > COLLAPSE_ABOVE
                  ? section.icons.slice(0, VISIBLE_TILES)
                  : section.icons
              }
            />
            {section.icons.length > COLLAPSE_ABOVE && (
              <details className="group/more mt-2">
                <summary className="ml-1 inline-flex cursor-pointer list-none items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm transition-colors hover:bg-accent hover:text-foreground group-open/more:hidden [&::-webkit-details-marker]:hidden">
                  Show {section.icons.length - VISIBLE_TILES} more
                </summary>
                <TileGrid icons={section.icons.slice(VISIBLE_TILES)} />
              </details>
            )}
          </section>
        ))}
      </div>

      <MoreFamilies others={others} />
    </div>
  );
}
