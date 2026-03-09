"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRight, Package, Sparkles, Zap } from "lucide-react";
import Link from "next/link";
import type { IconEntry } from "@/lib/icons";
import { IconCard } from "@/components/icons/icon-card";
import { IconGrid } from "@/components/icons/icon-grid";
import { IconDetail } from "@/components/icons/icon-detail";

/** Hand-picked popular brand slugs */
const POPULAR_SLUGS = [
  "google", "apple", "github", "microsoft", "amazon", "meta",
  "netflix", "spotify", "discord", "slack", "figma", "notion",
  "stripe", "vercel", "docker", "react", "nextdotjs", "typescript",
  "tailwindcss", "nodejs", "python", "rust", "openai", "claude",
  "firebase", "supabase", "postgresql", "mongodb", "redis", "linux",
  "aws", "cloudflare", "digitalocean", "github-copilot", "visual-studio-code",
  "chrome", "firefox", "safari", "android", "swift",
];


const SLIDES = [
  {
    badge: "Open Source",
    badgeIcon: Sparkles,
    title: "The Open SVG Brand Library",
    description: "Search, copy, and ship brand icons in seconds. Free, open-source, and community-driven.",
    cta: { label: "Get Started", href: "/extensions" },
    ctaSecondary: { label: "Submit an Icon", href: "/submit" },
    gradient: "from-orange-50/50 via-background to-orange-50/30 dark:from-orange-950/20 dark:via-background dark:to-orange-950/10",
    accent: "border-orange-200/50 bg-orange-50/80 text-orange-600 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-400",
    blob: "bg-orange-400/10 dark:bg-orange-500/5",
  },
  {
    badge: "npm install thesvg",
    badgeIcon: Package,
    title: "One Package, Every Brand",
    description: "Tree-shakeable, typed, dual ESM/CJS. Import any icon with zero config.",
    cta: { label: "View on npm", href: "https://www.npmjs.com/package/thesvg" },
    ctaSecondary: { label: "API Docs", href: "/api-docs" },
    gradient: "from-blue-50/50 via-background to-blue-50/30 dark:from-blue-950/20 dark:via-background dark:to-blue-950/10",
    accent: "border-blue-200/50 bg-blue-50/80 text-blue-600 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400",
    blob: "bg-blue-400/10 dark:bg-blue-500/5",
  },
  {
    badge: "Copy & Ship",
    badgeIcon: Zap,
    title: "SVG, JSX, CDN, or Download",
    description: "Every format you need. Copy raw SVG, grab a CDN link, or download files. Dark mode variants included.",
    cta: { label: "Browse Icons", href: "/" },
    ctaSecondary: { label: "Extensions", href: "/extensions" },
    gradient: "from-emerald-50/50 via-background to-emerald-50/30 dark:from-emerald-950/20 dark:via-background dark:to-emerald-950/10",
    accent: "border-emerald-200/50 bg-emerald-50/80 text-emerald-600 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400",
    blob: "bg-emerald-400/10 dark:bg-emerald-500/5",
  },
];

const SLIDE_DURATION = 6000;

interface HomeHeroProps {
  icons: IconEntry[];
  categoryCounts: { name: string; count: number }[];
  count: number;
  onSelectIcon: (icon: IconEntry) => void;
  onCategorySelect: (category: string) => void;
}

export function HomeHero({
  icons,
  categoryCounts,
  count,
  onCategorySelect,
}: HomeHeroProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState<IconEntry | null>(null);

  // Auto-rotate carousel
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, SLIDE_DURATION);
    return () => clearInterval(timer);
  }, [isPaused]);

  const handleSelectIcon = useCallback((icon: IconEntry) => {
    setSelectedIcon(icon);
  }, []);

  // Deterministic popular icons (no randomization)
  const popularIcons = useMemo(() => {
    return POPULAR_SLUGS
      .map((slug) => icons.find((i) => i.slug === slug))
      .filter(Boolean) as IconEntry[];
  }, [icons]);

  const topCategories = useMemo(
    () => [...categoryCounts].sort((a, b) => b.count - a.count).slice(0, 8),
    [categoryCounts]
  );

  const slide = SLIDES[currentSlide];
  const BadgeIcon = slide.badgeIcon;

  // Pick 6 floating icons for the banner decoration
  const floatingIcons = popularIcons.slice(0, 6);

  // Predefined positions for floating icons (scattered, not grid)
  const FLOAT_POSITIONS = [
    { top: "8%", right: "5%", size: "h-10 w-10", delay: "0s", opacity: "opacity-25" },
    { top: "20%", right: "18%", size: "h-8 w-8", delay: "0.8s", opacity: "opacity-20" },
    { top: "55%", right: "3%", size: "h-9 w-9", delay: "1.6s", opacity: "opacity-15" },
    { top: "40%", right: "22%", size: "h-7 w-7", delay: "2.4s", opacity: "opacity-20" },
    { top: "70%", right: "15%", size: "h-11 w-11", delay: "0.4s", opacity: "opacity-15" },
    { top: "15%", right: "30%", size: "h-6 w-6", delay: "1.2s", opacity: "opacity-10" },
  ];

  return (
    <div className="space-y-8 pb-6">
      {/* Hero carousel */}
      <div
        className={`relative overflow-hidden rounded-2xl border border-border/30 bg-gradient-to-br ${slide.gradient} px-6 py-10 transition-colors duration-700 sm:px-10 sm:py-14 dark:border-white/[0.06]`}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div className="relative z-10 max-w-2xl">
          {/* Slide content with fade */}
          <div key={currentSlide} className="animate-fade-in">
            <div className={`mb-3 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${slide.accent}`}>
              <BadgeIcon className="h-3 w-3" />
              {slide.badge === "Open Source"
                ? `${count.toLocaleString()}+ brand icons`
                : slide.badge}
            </div>
            <h2 className="mb-2 text-2xl font-bold tracking-tight sm:text-3xl">
              {slide.title}
            </h2>
            <p className="mb-6 max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base">
              {slide.description}
            </p>
            <div className="flex flex-wrap gap-3">
              {slide.cta.href.startsWith("http") ? (
                <a
                  href={slide.cta.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
                >
                  {slide.cta.label}
                  <ArrowRight className="h-3.5 w-3.5" />
                </a>
              ) : (
                <Link
                  href={slide.cta.href}
                  className="inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
                >
                  {slide.cta.label}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              )}
              <Link
                href={slide.ctaSecondary.href}
                className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent dark:border-white/[0.08]"
              >
                {slide.ctaSecondary.label}
              </Link>
            </div>
          </div>
        </div>

        {/* Decorative blobs */}
        <div className={`pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full ${slide.blob} blur-3xl transition-colors duration-700`} />
        <div className={`pointer-events-none absolute -bottom-10 -right-10 h-40 w-40 rounded-full ${slide.blob} blur-2xl transition-colors duration-700`} />

        {/* Floating scattered icons */}
        <div className="pointer-events-none absolute inset-0 hidden lg:block">
          {floatingIcons.map((icon, i) => {
            const pos = FLOAT_POSITIONS[i];
            return (
              <div
                key={icon.slug}
                className={`absolute animate-float ${pos.opacity}`}
                style={{
                  top: pos.top,
                  right: pos.right,
                  animationDelay: pos.delay,
                  animationDuration: `${4 + i * 0.5}s`,
                }}
              >
                <div className={`${pos.size} rounded-xl bg-background/30 p-1.5 backdrop-blur-sm`}>
                  <img src={icon.variants.light || icon.variants.default} alt="" className="h-full w-full object-contain dark:hidden" />
                  <img src={icon.variants.dark || icon.variants.default} alt="" className="hidden h-full w-full object-contain dark:block" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Thin glowing progress dots */}
        <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setCurrentSlide(i)}
              className="group relative"
              aria-label={`Go to slide ${i + 1}`}
            >
              <div
                className={`h-1 rounded-full transition-all duration-300 ${
                  i === currentSlide
                    ? "w-8 bg-foreground/50 shadow-[0_0_6px_rgba(255,255,255,0.3)]"
                    : "w-2 bg-foreground/15 hover:bg-foreground/25"
                }`}
              />
              {/* Active glow fill */}
              {i === currentSlide && !isPaused && (
                <div
                  className="animate-progress absolute inset-y-0 left-0 rounded-full bg-foreground/70 shadow-[0_0_8px_rgba(255,255,255,0.4)]"
                  style={{
                    animationName: "progress",
                    animationDuration: `${SLIDE_DURATION}ms`,
                    animationTimingFunction: "linear",
                  }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Popular icons */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <h2 className="text-sm font-semibold text-foreground">Popular</h2>
          <div className="h-px flex-1 bg-border/40 dark:bg-white/[0.04]" />
        </div>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3 lg:grid-cols-5 xl:grid-cols-6">
          {popularIcons.map((icon) => (
            <IconCard key={icon.slug} icon={icon} onSelect={handleSelectIcon} />
          ))}
        </div>
      </section>

      {/* Browse by category */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <h2 className="text-sm font-semibold text-foreground">Browse by Category</h2>
          <div className="h-px flex-1 bg-border/40 dark:bg-white/[0.04]" />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {topCategories.map((cat) => (
            <button
              key={cat.name}
              type="button"
              onClick={() => onCategorySelect(cat.name)}
              className="group flex items-center justify-between rounded-xl border border-border/40 bg-card/50 px-4 py-3 text-left transition-all hover:border-border hover:bg-card hover:shadow-md dark:border-white/[0.06] dark:bg-white/[0.02] dark:hover:border-white/[0.1] dark:hover:bg-white/[0.04]"
            >
              <span className="text-sm font-medium text-foreground">{cat.name}</span>
              <span className="rounded-full bg-muted/60 px-2 py-0.5 font-mono text-[10px] text-muted-foreground dark:bg-white/[0.04]">
                {cat.count}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* All Icons - with infinite scroll */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <h2 className="text-sm font-semibold text-foreground">All Icons</h2>
          <span className="text-xs text-muted-foreground">{icons.length.toLocaleString()}</span>
          <div className="h-px flex-1 bg-border/40 dark:bg-white/[0.04]" />
        </div>
        <IconGrid icons={icons} />
      </section>

      {/* Detail modal */}
      <IconDetail icon={selectedIcon} onClose={() => setSelectedIcon(null)} />
    </div>
  );
}
