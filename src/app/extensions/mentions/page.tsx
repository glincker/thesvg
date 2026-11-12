import { Suspense } from "react";
import Link from "next/link";
import { ArrowUpRight, Github } from "@/components/own-icons";
import type { Metadata } from "next";
import { getCategoryCounts, getIconBySlug } from "@/lib/icons";
import { SidebarShell } from "@/components/layout/sidebar-shell";
import { MENTIONS, type Mention } from "@/lib/mentions";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Mentioned on - Where thesvg is listed",
  description:
    "Projects, lists and write-ups that use or link to thesvg, the open SVG brand library.",
  openGraph: {
    title: "Mentioned on | theSVG",
    description:
      "Projects, lists and write-ups that use or link to thesvg, the open SVG brand library.",
    siteName: "theSVG",
  },
  alternates: { canonical: "https://thesvg.org/extensions/mentions" },
};

type Kind = NonNullable<Mention["kind"]>;

const GROUPS: { kind: Kind; label: string; blurb: string }[] = [
  { kind: "code", label: "Used in code", blurb: "Projects that fetch, depend on or vendor thesvg icons." },
  { kind: "list", label: "Listed in curated lists", blurb: "Directories and awesome lists that point to thesvg." },
  { kind: "editorial", label: "Written about", blurb: "Reviews and articles." },
];

const formatDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });

// Featured first, then most recent. ISO dates sort lexically.
const byPriority = (a: Mention, b: Mention) =>
  Number(!!b.featured) - Number(!!a.featured) || b.date.localeCompare(a.date);

function describeLink(url: string): { isGithub: boolean; label: string } {
  const u = new URL(url);
  const host = u.hostname.replace(/^www\./, "");
  if (host === "github.com") {
    const [owner, repo] = u.pathname.split("/").filter(Boolean);
    return { isGithub: true, label: repo ? `${owner}/${repo}` : owner ?? host };
  }
  return { isGithub: false, label: host };
}

// Theme-aware thesvg logo. `light` is the dark-fill file for light backgrounds,
// `dark` is the light-fill file for dark backgrounds.
function Logo({ slug, className }: { slug: string; className: string }) {
  const icon = getIconBySlug(slug);
  if (!icon) return null;
  return (
    <>
      <img src={icon.variants.light || icon.variants.default} alt="" className={cn(className, "dark:hidden")} />
      <img src={icon.variants.dark || icon.variants.default} alt="" className={cn(className, "hidden dark:block")} />
    </>
  );
}

function LogoTile({ mention, large }: { mention: Mention; large: boolean }) {
  const hasLogo = !!mention.logo && !!getIconBySlug(mention.logo);
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex shrink-0 items-center justify-center rounded-lg border border-border/40 bg-background/60 dark:border-white/[0.06] dark:bg-white/[0.04]",
        large ? "h-12 w-12" : "h-10 w-10",
      )}
    >
      {hasLogo && mention.logo ? (
        <Logo slug={mention.logo} className={large ? "h-7 w-7 object-contain" : "h-6 w-6 object-contain"} />
      ) : (
        <span className="text-sm font-semibold text-muted-foreground">
          {mention.source.charAt(0).toUpperCase()}
        </span>
      )}
    </span>
  );
}

function MentionCard({ mention }: { mention: Mention }) {
  const large = !!mention.featured;
  const link = describeLink(mention.url);
  return (
    <li className={cn("flex", large && "md:col-span-2")}>
      <a
        href={mention.url}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "group flex w-full flex-col rounded-xl border border-border/40 bg-card/30 transition-colors hover:border-border/70 hover:bg-card/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:border-white/[0.06] dark:bg-white/[0.02] dark:hover:border-white/[0.1] dark:hover:bg-white/[0.04]",
          large ? "p-6" : "p-5",
        )}
      >
        <div className="mb-4 flex items-center gap-3">
          <LogoTile mention={mention} large={large} />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{mention.source}</p>
            <p className="text-xs text-muted-foreground">
              <time dateTime={mention.date}>{formatDate(mention.date)}</time>
            </p>
          </div>
        </div>

        <h3 className={cn("font-semibold leading-snug", large ? "text-lg" : "text-base")}>
          {mention.title}
        </h3>
        <p className="mt-2 flex-1 text-sm text-muted-foreground">{mention.description}</p>

        <div className="mt-5 flex items-center justify-between gap-3 border-t border-border/40 pt-3 text-xs text-muted-foreground dark:border-white/[0.06]">
          <span className="flex min-w-0 items-center gap-1.5">
            {link.isGithub ? <Logo slug="github" className="h-3.5 w-3.5 shrink-0 object-contain" /> : null}
            <span className="truncate">{link.label}</span>
          </span>
          <span className="inline-flex shrink-0 items-center gap-1 font-medium transition-colors group-hover:text-foreground">
            Open
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            <span className="sr-only">(opens in a new tab)</span>
          </span>
        </div>
      </a>
    </li>
  );
}

export default function MentionsPage() {
  const categoryCounts = getCategoryCounts();
  const sections = GROUPS.map((g) => ({
    ...g,
    items: MENTIONS.filter((m) => m.kind === g.kind).sort(byPriority),
  }));
  const untagged = MENTIONS.filter((m) => !m.kind).sort(byPriority);
  if (untagged.length) {
    sections.push({ kind: "editorial", label: "More mentions", blurb: "", items: untagged });
  }
  const visible = sections.filter((s) => s.items.length > 0);
  const summary = visible
    .filter((s) => s.label !== "More mentions")
    .map((s) => `${s.items.length} ${s.label.toLowerCase()}`)
    .join(", ");

  return (
    <Suspense>
      <SidebarShell categoryCounts={categoryCounts}>
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
          {/* Header */}
          <div className="mb-10">
            <h1 className="mb-2 text-2xl font-bold sm:text-3xl">Mentioned on</h1>
            <p className="max-w-2xl text-muted-foreground">
              Projects that use thesvg, lists that include it and pages that write about it.
            </p>
            <p className="mt-3 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{MENTIONS.length} mentions</span>
              {summary ? <span>{`: ${summary}`}</span> : null}
            </p>
          </div>

          {/* Groups */}
          <div className="space-y-12">
            {visible.map((section) => (
              <section key={section.label} aria-labelledby={`m-${section.label.replace(/\s+/g, "-").toLowerCase()}`}>
                <div className="mb-4 flex items-center gap-2">
                  <h2
                    id={`m-${section.label.replace(/\s+/g, "-").toLowerCase()}`}
                    className="text-sm font-semibold text-foreground"
                  >
                    {section.label}
                  </h2>
                  <span className="rounded-full bg-muted/60 px-2 py-0.5 font-mono text-[10px] text-muted-foreground dark:bg-white/[0.04]">
                    {section.items.length}
                  </span>
                  <div className="h-px flex-1 bg-border/40 dark:bg-white/[0.04]" />
                </div>
                {section.blurb ? (
                  <p className="mb-4 text-sm text-muted-foreground">{section.blurb}</p>
                ) : null}
                <ul className="grid grid-flow-dense gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {section.items.map((mention) => (
                    <MentionCard key={mention.url} mention={mention} />
                  ))}
                </ul>
              </section>
            ))}
          </div>

          {/* Invitation */}
          <div className="mt-14 overflow-hidden rounded-xl border border-border/40 bg-gradient-to-br from-card/50 to-muted/20 dark:border-white/[0.06] dark:from-white/[0.03] dark:to-white/[0.01]">
            <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
              <div>
                <h2 className="mb-1 text-lg font-semibold">Know a page that mentions thesvg?</h2>
                <p className="max-w-xl text-sm text-muted-foreground">
                  Open an issue with the link and we will add it here.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <a
                  href="https://github.com/GLINCKER/thesvg/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <Github className="h-4 w-4" />
                  Open an issue
                </a>
                <Link
                  href="/extensions"
                  className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  Extensions
                </Link>
              </div>
            </div>
          </div>
        </div>
      </SidebarShell>
    </Suspense>
  );
}
