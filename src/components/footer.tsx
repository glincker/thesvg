import { UiGlyph } from "@/components/ui-glyph";
import { TheSVGMark } from "@/components/icons/the-svg-mark";
import Link from "next/link";
import {
  TRADEMARK_POLICY_URL,
  TRENDSHIFT_BADGE_SRC,
  TRENDSHIFT_URL,
} from "@/lib/constants";
import { withUtm } from "@/lib/external-link";
import {
  getIconCount,
  getVariantCount,
  getCollections,
} from "@/lib/icons";
import { AnimatedCounter } from "@/components/footer-counter";
import { T } from "@/components/t";
import uiManifest from "@/data/ui-icons.json";

interface FooterLink {
  label: string;
  /** Key in the locale files; the English label is the fallback. */
  i18n?: string;
  href: string;
  external?: boolean;
  /** UI glyph shown before the label. */
  glyph?: string;
  /** Brand icon slug under /icons, shown before the label. */
  brand?: string;
}

const PRODUCT_LINKS: FooterLink[] = [
  { label: "Brand Icons", i18n: "nav.brandIcons", href: "/", glyph: "layout-grid" },
  { label: "UI Icons", i18n: "nav.uiIcons", href: "/ui", glyph: "shapes" },
  { label: "Categories", i18n: "nav.categories", href: "/categories", glyph: "layers" },
  { label: "Flags", i18n: "nav.flags", href: "/collection/flags", glyph: "flag" },
  { label: "Docs", i18n: "nav.docs", href: "/docs", glyph: "book-open" },
  { label: "Submit Icon", i18n: "nav.submitIcon", href: "/submit", glyph: "upload" },
  { label: "Blog", i18n: "nav.blog", href: "/blog", glyph: "newspaper" },
];

const RESOURCE_LINKS: FooterLink[] = [
  { label: "Figma Plugin", i18n: "footer.links.figmaPlugin", href: "https://www.figma.com/community/plugin/1612997159050367763", external: true, brand: "figma" },
  { label: "VS Code Extension", i18n: "footer.links.vscodeExtension", href: "https://marketplace.visualstudio.com/items?itemName=glincker.thesvg", external: true, brand: "visual-studio-code" },
  { label: "Raycast Extension", i18n: "footer.links.raycastExtension", href: "https://www.raycast.com/thegdsks/thesvg", external: true, brand: "raycast" },
  { label: "npm Packages", href: "/packages", brand: "npm" },
  { label: "CDN Usage", i18n: "nav.cdnUsage", href: "/extensions", glyph: "cloud" },
  { label: "Compare", i18n: "nav.compare", href: "/compare", glyph: "git-compare" },
];

const COMMUNITY_LINKS: FooterLink[] = [
  { label: "GitHub", href: "https://github.com/GLINCKER/thesvg", external: true, glyph: "git-branch" },
  { label: "Issues", i18n: "footer.links.issues", href: "https://github.com/GLINCKER/thesvg/issues", external: true, glyph: "circle-alert" },
  { label: "Discussions", i18n: "footer.links.discussions", href: "https://github.com/GLINCKER/thesvg/discussions", external: true, glyph: "messages-square" },
  { label: "Discord", href: "https://discord.gg/Ar5pcaZB99", external: true, brand: "discord" },
  { label: "Mentions", i18n: "footer.links.mentions", href: "/extensions/mentions", glyph: "megaphone" },
  { label: "Contributing", i18n: "footer.links.contributing", href: "https://github.com/GLINCKER/thesvg/blob/main/CONTRIBUTING.md", external: true, glyph: "git-pull-request" },
  { label: "Sponsor", i18n: "footer.links.sponsor", href: "https://github.com/sponsors/glincker", external: true, glyph: "heart" },
];

const LEGAL_LINKS: FooterLink[] = [
  { label: "Legal", i18n: "footer.links.legal", href: "/legal", glyph: "scale" },
  { label: "Privacy", i18n: "footer.links.privacy", href: "/privacy", glyph: "lock" },
  { label: "Trademark Policy", i18n: "footer.links.trademarkPolicy", href: TRADEMARK_POLICY_URL, external: true, glyph: "badge-check" },
  { label: "Contact", i18n: "footer.links.contact", href: "/contact", glyph: "mail" },
];

const SOCIALS = [
  { label: "GitHub", slug: "github", href: "https://github.com/GLINCKER/thesvg" },
  { label: "npm packages", slug: "npm", href: "https://www.npmjs.com/package/thesvg" },
  { label: "Figma plugin", slug: "figma", href: "https://www.figma.com/community/plugin/1612997159050367763" },
  { label: "VS Code extension", slug: "visual-studio-code", href: "https://marketplace.visualstudio.com/items?itemName=glincker.thesvg" },
  { label: "Raycast extension", slug: "raycast", href: "https://www.raycast.com/thegdsks/thesvg" },
  { label: "Discord", slug: "discord", href: "https://discord.gg/Ar5pcaZB99" },
];

function LinkIcon({ link }: { link: FooterLink }) {
  if (link.brand) {
    return <img src={`/icons/${link.brand}/default.svg`} alt="" width={16} height={16} className="size-4 shrink-0" />;
  }
  // Our glass look, a touch larger than the text so the frosted pane has room to read.
  if (link.glyph) return <UiGlyph name={link.glyph} className="size-4.5 shrink-0 text-foreground/70 transition-colors group-hover:text-orange-500" />;
  return null;
}

function FooterLinkItem({ link }: { link: FooterLink }) {
  const cls = "group flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm";
  if (link.external) {
    return (
      <a href={withUtm(link.href, "footer")} target="_blank" rel="noopener noreferrer" className={cls}>
        <LinkIcon link={link} />
        {link.i18n ? <T k={link.i18n} fallback={link.label} /> : link.label}
        <UiGlyph name="arrow-up-right" className="size-3 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
      </a>
    );
  }

  return (
    <Link href={link.href} className={cls}>
      <LinkIcon link={link} />
      {link.i18n ? <T k={link.i18n} fallback={link.label} /> : link.label}
    </Link>
  );
}

function FooterColumn({ title, titleKey, links }: { title: string; titleKey: string; links: FooterLink[] }) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/80">
        <T k={titleKey} fallback={title} />
      </h3>
      <ul className="flex flex-col gap-2.5">
        {links.map((link) => (
          <li key={link.label}>
            <FooterLinkItem link={link} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function StatItem({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number;
  label: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500/10 dark:bg-orange-500/10">
        {icon}
      </div>
      <div>
        <AnimatedCounter value={value} className="text-sm font-semibold text-foreground" />
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

/** The real GitHub brand icon, not our UI mark: the footer links to GitHub itself. */
function GithubMark({ className }: { className: string }) {
  return <img src="/icons/github/mono.svg" alt="" aria-hidden="true" width={18} height={18} className={`${className} dark:invert`} />;
}

export function Footer() {
  const iconCount = getIconCount();
  const uiIconCount = uiManifest.icons.length;
  const variantCount = getVariantCount();
  const collectionCount = getCollections().length;

  return (
    <footer className="mt-16 pb-6 md:pl-58">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* CTA Banner */}
        <div className="mb-6 rounded-2xl border border-orange-500/20 bg-gradient-to-br from-orange-50/30 via-background to-background p-6 dark:border-orange-500/15 dark:from-orange-500/[0.04] dark:via-background dark:to-background sm:p-8">
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                <T k="footer.headline" fallback="Open source. Community driven." />
              </h2>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                <T k="footer.tagline" fallback="Free brand SVGs for developers, designers, and teams. Use them in any project, no attribution required." />
              </p>
            </div>
            <div className="flex flex-wrap gap-x-8 gap-y-4">
              <StatItem
                icon={<UiGlyph name="layers" className="size-5 text-orange-500" />}
                value={iconCount}
                label={<T k="footer.stats.brandIcons" fallback="Brand Icons" />}
              />
              <StatItem
                icon={<UiGlyph name="shapes" className="size-5 text-orange-500" />}
                value={uiIconCount}
                label={<T k="footer.stats.uiIcons" fallback="UI Icons" />}
              />
              <StatItem
                icon={<UiGlyph name="package" className="size-5 text-orange-500" />}
                value={variantCount}
                label={<T k="footer.stats.svgVariants" fallback="SVG Variants" />}
              />
              <StatItem
                icon={<UiGlyph name="download" className="size-5 text-orange-500" />}
                value={collectionCount}
                label={<T k="footer.stats.collections" fallback="Collections" />}
              />
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/submit"
              className="inline-flex items-center rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
            >
              <T k="footer.submitAnIcon" fallback="Submit an Icon" />
            </Link>
            <a
              href={withUtm("https://github.com/GLINCKER/thesvg", "footer")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-border/60 px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground dark:border-white/[0.1]"
            >
              <GithubMark className="h-4 w-4" />
              Star on GitHub
            </a>
            <a
              href={TRENDSHIFT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={TRENDSHIFT_BADGE_SRC}
                alt="glincker/thesvg | Trendshift"
                width={250}
                height={55}
                loading="lazy"
                className="h-[55px] w-[250px]"
              />
            </a>
          </div>
        </div>

        {/* Main footer card */}
        <div className="rounded-2xl border border-border/40 bg-card/30 p-8 dark:border-white/[0.06] dark:bg-white/[0.02] sm:p-10 lg:p-12">
          {/* Main grid: brand + 4 link columns */}
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-5">
            {/* Brand column */}
            <div className="flex flex-col gap-4 sm:col-span-2 lg:col-span-1">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-lg font-bold text-foreground"
              >
                <TheSVGMark className="h-6 w-6" />
                <span>
                  the<span className="text-orange-500">SVG</span>
                </span>
              </Link>
              <p className="text-sm leading-relaxed text-muted-foreground">
                The Open SVG Brand Library. No gatekeeping. Every brand deserves a place.
              </p>
              <p className="flex flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground/60">
                A
                <a
                  href={withUtm("https://glinr.com/branding", "footer")}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="GLINR Studios brand logo"
                  className="inline-flex items-center opacity-80 transition-opacity hover:opacity-100"
                >
                  <img
                    src="/icons/glinr/wordmark-light.svg"
                    alt="GLINR Studios"
                    width={130}
                    height={20}
                    className="h-5 w-auto dark:hidden"
                  />
                  <img
                    src="/icons/glinr/wordmark-dark.svg"
                    alt="GLINR Studios"
                    width={130}
                    height={20}
                    className="hidden h-5 w-auto dark:block"
                  />
                </a>
                project
              </p>
              <ul className="-ml-1.5 flex flex-wrap items-center gap-0.5" aria-label="theSVG on the web">
                {SOCIALS.map((item) => (
                  <li key={item.label}>
                    <a
                      href={withUtm(item.href, "footer")}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={item.label}
                      title={item.label}
                      className="inline-flex size-9 items-center justify-center rounded-lg opacity-75 transition-opacity hover:bg-accent/60 hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {item.slug === "github" ? (
                        <GithubMark className="size-[18px]" />
                      ) : (
                        <img src={`/icons/${item.slug}/default.svg`} alt="" width={18} height={18} className="size-[18px]" />
                      )}
                    </a>
                  </li>
                ))}
              </ul>
              <a
                href={withUtm(
                  "https://www.producthunt.com/products/thesvg/reviews/new?utm_source=badge-product_review&utm_medium=badge&utm_source=badge-thesvg",
                  "footer"
                )}
                target="_blank"
                rel="noopener noreferrer"
              >
                { }
                <img
                  src="https://api.producthunt.com/widgets/embed-image/v1/product_review.svg?product_id=1176978&theme=dark"
                  alt="theSVG on Product Hunt"
                  width={200}
                  height={43}
                  className="hidden opacity-60 transition-opacity hover:opacity-100 dark:block"
                />
                { }
                <img
                  src="https://api.producthunt.com/widgets/embed-image/v1/product_review.svg?product_id=1176978&theme=light"
                  alt="theSVG on Product Hunt"
                  width={200}
                  height={43}
                  className="block opacity-60 transition-opacity hover:opacity-100 dark:hidden"
                />
              </a>
            </div>

            {/* Link columns */}
            <FooterColumn title="Product" titleKey="footer.columns.product" links={PRODUCT_LINKS} />
            <FooterColumn title="Resources" titleKey="footer.columns.resources" links={RESOURCE_LINKS} />
            <div className="flex flex-col gap-3">
              <FooterColumn title="Community" titleKey="footer.columns.community" links={COMMUNITY_LINKS} />
              <a
                href={withUtm("https://thegdsks.com", "footer")}
                target="_blank"
                rel="noopener noreferrer"
                className="group mt-1 inline-flex w-fit items-center gap-1.5 rounded-full border border-orange-500/25 bg-orange-500/[0.06] py-1 pl-1 pr-3 text-xs font-medium text-foreground transition-colors hover:border-orange-500/40 hover:bg-orange-500/10"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500/15">
                  <UiGlyph name="heart" className="size-3 text-orange-500" />
                </span>
                <T k="footer.meetFounder" fallback="Meet the founder" />
                <UiGlyph name="arrow-up-right" className="size-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </a>
            </div>
            <FooterColumn title="Legal" titleKey="footer.columns.legal" links={LEGAL_LINKS} />
          </div>

          {/* GLINR Studios section */}
          <div className="mt-10 border-t border-border/40 pt-8 text-center dark:border-white/[0.06]">
            <p className="text-sm text-muted-foreground">
              A project by{" "}
              <a
                href={withUtm("https://glinr.com", "footer")}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-foreground transition-colors hover:text-muted-foreground"
              >
                GLINR Studios
              </a>
            </p>
            <div className="mt-4 flex flex-col items-center gap-3">
              <span className="text-xs uppercase tracking-wider text-muted-foreground/70">
                Founding Partners
              </span>
              <div className="flex items-center gap-6">
                <a
                  href={withUtm("https://glinr.com", "footer")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 opacity-60 transition-opacity hover:opacity-100"
                >
                  { }
                  <img
                    src="/icons/glinr/dark.svg"
                    alt="GLINR Studios"
                    width={20}
                    height={20}
                    className="hidden dark:block"
                  />
                  { }
                  <img
                    src="/icons/glinr/light.svg"
                    alt="GLINR Studios"
                    width={20}
                    height={20}
                    className="block dark:hidden"
                  />
                  <span className="text-xs text-muted-foreground">glinr.com</span>
                </a>
                <span className="text-border/40">|</span>
                <a
                  href={withUtm("https://levelrail.com", "footer")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 opacity-60 transition-opacity hover:opacity-100"
                >
                  { }
                  { }
                  <img src="/icons/levelrail/mono.svg" alt="Levelrail" width={20} height={20} className="hidden dark:invert dark:block" />
                  { }
                  <img src="/icons/levelrail/mono.svg" alt="Levelrail" width={20} height={20} className="block dark:hidden" />
                  <span className="text-xs text-muted-foreground">levelrail.com</span>
                </a>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-8 flex flex-col items-center gap-3 border-t border-border/40 pt-6 dark:border-white/[0.06] sm:flex-row sm:justify-between">
            <p className="text-xs text-muted-foreground/70">
              &copy; {new Date().getFullYear()} GLINCKER. All rights reserved.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-muted-foreground/70">
              <span>
                All brand logos and trademarks belong to their respective owners.{" "}
                <a
                  href={withUtm(TRADEMARK_POLICY_URL, "footer")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 transition-colors hover:text-muted-foreground"
                >
                  Trademark Policy
                </a>
              </span>
              <span className="hidden text-border/40 sm:inline">|</span>
              <span>
                Built by{" "}
                <a
                  href={withUtm("https://glinr.com", "footer")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium transition-colors hover:text-muted-foreground"
                >
                  GLINR Studios
                </a>
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
