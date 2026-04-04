import { ArrowUpRight, Github, Download, Layers, Package } from "lucide-react";
import Link from "next/link";
import { TRADEMARK_POLICY_URL } from "@/lib/constants";
import {
  getIconCount,
  getVariantCount,
  getCollections,
} from "@/lib/icons";
import { AnimatedCounter } from "@/components/footer-counter";

interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
}

const PRODUCT_LINKS: FooterLink[] = [
  { label: "Browse Icons", href: "/" },
  { label: "Categories", href: "/categories" },
  { label: "Extensions", href: "/extensions" },
  { label: "Submit Icon", href: "/submit" },
];

const RESOURCE_LINKS: FooterLink[] = [
  { label: "npm Package", href: "https://www.npmjs.com/package/thesvg", external: true },
  { label: "CDN Usage", href: "/extensions" },
  { label: "Compare", href: "/compare" },
];

const COMMUNITY_LINKS: FooterLink[] = [
  { label: "GitHub", href: "https://github.com/GLINCKER/thesvg", external: true },
  { label: "Issues", href: "https://github.com/GLINCKER/thesvg/issues", external: true },
  { label: "Discussions", href: "https://github.com/GLINCKER/thesvg/discussions", external: true },
  { label: "Contributing", href: "https://github.com/GLINCKER/thesvg/blob/main/CONTRIBUTING.md", external: true },
];

const LEGAL_LINKS: FooterLink[] = [
  { label: "Legal", href: "/legal" },
  { label: "Trademark Policy", href: TRADEMARK_POLICY_URL, external: true },
  { label: "Contact", href: "/contact" },
];

function FooterLinkItem({ link }: { link: FooterLink }) {
  if (link.external) {
    return (
      <a
        href={link.href}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        {link.label}
        <ArrowUpRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
      </a>
    );
  }

  return (
    <Link
      href={link.href}
      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      {link.label}
    </Link>
  );
}

function FooterColumn({ title, links }: { title: string; links: FooterLink[] }) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
        {title}
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
  label: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100/40 backdrop-blur-sm dark:bg-white/[0.05]">
        {icon}
      </div>
      <div>
        <AnimatedCounter value={value} className="text-sm font-semibold text-foreground" />
        <p className="text-[11px] text-muted-foreground/70">{label}</p>
      </div>
    </div>
  );
}

export function Footer() {
  const iconCount = getIconCount();
  const variantCount = getVariantCount();
  const collectionCount = getCollections().length;

  return (
    <footer className="mt-16 pb-6 md:pl-58">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* CTA Banner */}
        <div className="mb-6 rounded-2xl border border-blue-200/30 bg-gradient-to-br from-blue-50/40 via-white/50 to-indigo-50/30 p-6 shadow-[inset_0_1px_2px_rgba(255,255,255,0.5),0_1px_3px_rgba(0,0,0,0.04)] backdrop-blur-xl dark:border-white/[0.06] dark:from-white/[0.03] dark:via-white/[0.02] dark:to-blue-500/[0.02] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] sm:p-8">
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Open source. Community driven.
              </h2>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                Free brand SVGs for developers, designers, and teams.
                Use them in any project, no attribution required.
              </p>
            </div>
            <div className="flex flex-wrap gap-6 sm:gap-8">
              <StatItem
                icon={<Layers className="h-4 w-4 text-muted-foreground" />}
                value={iconCount}
                label="Brand Icons"
              />
              <StatItem
                icon={<Package className="h-4 w-4 text-muted-foreground" />}
                value={variantCount}
                label="SVG Variants"
              />
              <StatItem
                icon={<Download className="h-4 w-4 text-muted-foreground" />}
                value={collectionCount}
                label="Collections"
              />
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/submit"
              className="inline-flex items-center rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
            >
              Submit an Icon
            </Link>
            <a
              href="https://github.com/GLINCKER/thesvg"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-border/60 px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground dark:border-white/[0.1]"
            >
              <Github className="h-4 w-4" />
              Star on GitHub
            </a>
          </div>
        </div>

        {/* Main footer card */}
        <div className="rounded-2xl border border-blue-200/30 bg-gradient-to-br from-blue-50/30 via-white/40 to-indigo-50/20 p-8 shadow-[inset_0_1px_2px_rgba(255,255,255,0.5),0_1px_3px_rgba(0,0,0,0.04)] backdrop-blur-xl dark:border-white/[0.06] dark:from-white/[0.03] dark:via-white/[0.02] dark:to-blue-500/[0.02] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] sm:p-10 lg:p-12">
          {/* Main grid: brand + 4 link columns */}
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-5">
            {/* Brand column */}
            <div className="flex flex-col gap-4 sm:col-span-2 lg:col-span-1">
              <Link href="/" className="text-lg font-bold text-foreground">
                theSVG
              </Link>
              <p className="text-sm leading-relaxed text-muted-foreground">
                The Open SVG Brand Library. No gatekeeping. Every brand deserves a place.
              </p>
              <p className="text-xs text-muted-foreground/60">
                A{" "}
                <a
                  href="https://glincker.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-muted-foreground/80 transition-colors hover:text-foreground"
                >
                  GLINCKER
                </a>{" "}
                project
              </p>
              <div className="flex items-center gap-3">
                <a
                  href="https://github.com/GLINCKER/thesvg"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground/60 transition-colors hover:text-foreground"
                  aria-label="GitHub"
                >
                  <Github className="h-4 w-4" />
                </a>
                <a
                  href="https://www.npmjs.com/package/thesvg"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 transition-colors hover:text-foreground"
                  aria-label="npm"
                >
                  npm
                </a>
              </div>
              <a
                href="https://www.producthunt.com/products/thesvg/reviews/new?utm_source=badge-product_review&utm_medium=badge&utm_source=badge-thesvg"
                target="_blank"
                rel="noopener noreferrer"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://api.producthunt.com/widgets/embed-image/v1/product_review.svg?product_id=1176978&theme=dark"
                  alt="theSVG on Product Hunt"
                  width={200}
                  height={43}
                  className="hidden opacity-60 transition-opacity hover:opacity-100 dark:block"
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
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
            <FooterColumn title="Product" links={PRODUCT_LINKS} />
            <FooterColumn title="Resources" links={RESOURCE_LINKS} />
            <FooterColumn title="Community" links={COMMUNITY_LINKS} />
            <FooterColumn title="Legal" links={LEGAL_LINKS} />
          </div>

          {/* GLINR Studios section */}
          <div className="mt-10 border-t border-border/40 pt-8 text-center dark:border-white/[0.06]">
            <p className="text-sm text-muted-foreground">
              A project by{" "}
              <a
                href="https://glinr.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-foreground transition-colors hover:text-muted-foreground"
              >
                GLINR Studios
              </a>
            </p>
            <div className="mt-4 flex flex-col items-center gap-3">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground/50">
                Founding Partners
              </span>
              <div className="flex items-center gap-6">
                <a
                  href="https://glincker.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 opacity-60 transition-opacity hover:opacity-100"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/icons/glincker/light.svg"
                    alt="GLINCKER"
                    width={20}
                    height={20}
                    className="hidden dark:block"
                  />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/icons/glincker/dark.svg"
                    alt="GLINCKER"
                    width={20}
                    height={20}
                    className="block dark:hidden"
                  />
                  <span className="text-xs text-muted-foreground">glincker.com</span>
                </a>
                <span className="text-border/40">|</span>
                <a
                  href="https://askverdict.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 opacity-60 transition-opacity hover:opacity-100"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/icons/askverdict-ai/light.svg"
                    alt="AskVerdict"
                    width={20}
                    height={20}
                    className="hidden dark:block"
                  />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/icons/askverdict-ai/dark.svg"
                    alt="AskVerdict"
                    width={20}
                    height={20}
                    className="block dark:hidden"
                  />
                  <span className="text-xs text-muted-foreground">askverdict.ai</span>
                </a>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-8 flex flex-col items-center gap-3 border-t border-border/40 pt-6 dark:border-white/[0.06] sm:flex-row sm:justify-between">
            <p className="text-[11px] text-muted-foreground/50">
              &copy; 2026 GLINCKER. All rights reserved.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground/50">
              <span>
                All brand logos and trademarks belong to their respective owners.{" "}
                <a
                  href={TRADEMARK_POLICY_URL}
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
                  href="https://glinr.com"
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
