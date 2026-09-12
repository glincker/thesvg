import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Rss, Sparkles } from "lucide-react";
import { SidebarShell } from "@/components/layout/sidebar-shell";
import { getCategoryCounts } from "@/lib/icons";
import postsData from "@/data/posts.json";
import { withUtm } from "@/lib/external-link";

export const metadata: Metadata = {
  title: "Blog - Announcements & Updates",
  description:
    "Latest news, releases, and updates from theSVG. New icon collections, features, and developer resources.",
  keywords: [
    "theSVG blog",
    "icon library updates",
    "SVG icon releases",
    "developer tools blog",
    "open source icons",
  ],
  openGraph: {
    title: "Blog | theSVG",
    description: "Latest updates from theSVG - the open SVG brand library.",
    siteName: "theSVG",
  },
  alternates: { canonical: "https://thesvg.org/blog" },
};

interface Post {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  author: string;
  tags: string[];
}

const TAG_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  launch: { bg: "bg-emerald-500/10", text: "text-emerald-500", dot: "bg-emerald-500" },
  release: { bg: "bg-blue-500/10", text: "text-blue-500", dot: "bg-blue-500" },
  aws: { bg: "bg-[#ff9900]/10", text: "text-[#ff9900]", dot: "bg-[#ff9900]" },
  azure: { bg: "bg-[#0078d4]/10", text: "text-[#0078d4]", dot: "bg-[#0078d4]" },
  gcp: { bg: "bg-[#4285f4]/10", text: "text-[#4285f4]", dot: "bg-[#4285f4]" },
  cloud: { bg: "bg-violet-500/10", text: "text-violet-500", dot: "bg-violet-500" },
  milestone: { bg: "bg-amber-500/10", text: "text-amber-500", dot: "bg-amber-500" },
  roadmap: { bg: "bg-rose-500/10", text: "text-rose-500", dot: "bg-rose-500" },
  "open-source": { bg: "bg-green-500/10", text: "text-green-500", dot: "bg-green-500" },
};

const DEFAULT_TAG = { bg: "bg-muted/50", text: "text-muted-foreground", dot: "bg-muted-foreground" };

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function BlogPage() {
  const posts = (postsData as Post[]).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const [featured, ...rest] = posts;

  return (
    <SidebarShell categoryCounts={getCategoryCounts()}>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        {/* Header */}
        <div className="mb-10 flex items-end justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1 text-xs font-medium text-orange-500">
              <Sparkles className="h-3 w-3" />
              Updates
            </div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Blog</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              What we shipped, what we learned, and what is next
            </p>
          </div>
          <a
            href="/feed.xml"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden items-center gap-1.5 rounded-lg border border-border/50 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:border-orange-500/30 hover:text-orange-500 sm:inline-flex dark:border-white/[0.08]"
          >
            <Rss className="h-3.5 w-3.5" />
            RSS
          </a>
        </div>

        {/* Featured post - large card */}
        {featured && (
          <Link
            href={`/blog/${featured.slug}`}
            className="group relative mb-10 block overflow-hidden rounded-3xl border border-border/40 bg-gradient-to-br from-orange-500/5 via-background to-amber-500/5 transition-all duration-300 hover:border-orange-500/30 hover:shadow-2xl hover:shadow-orange-500/5 dark:border-white/[0.06] dark:from-orange-500/[0.03] dark:to-amber-500/[0.03] dark:hover:border-orange-500/20"
          >
            {/* Glow */}
            <div className="pointer-events-none absolute -top-20 -right-20 h-60 w-60 rounded-full bg-orange-500/10 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100" />

            <div className="relative p-8 sm:p-10">
              {/* Badge */}
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-orange-500/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-orange-500">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-orange-500" />
                Latest
              </div>

              <h2 className="mb-3 max-w-2xl text-2xl font-bold tracking-tight transition-colors group-hover:text-orange-500 sm:text-3xl">
                {featured.title}
              </h2>

              <p className="mb-6 max-w-xl text-sm leading-relaxed text-muted-foreground">
                {featured.excerpt}
              </p>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-xs text-muted-foreground/60">{formatDate(featured.date)}</span>
                  <div className="flex gap-1.5">
                    {featured.tags.map((tag) => {
                      const colors = TAG_COLORS[tag] ?? DEFAULT_TAG;
                      return (
                        <span
                          key={tag}
                          className={`inline-flex items-center gap-1 rounded-full ${colors.bg} px-2 py-0.5 text-[10px] font-medium ${colors.text}`}
                        >
                          <span className={`h-1 w-1 rounded-full ${colors.dot}`} />
                          {tag}
                        </span>
                      );
                    })}
                  </div>
                </div>
                <span className="flex items-center gap-1 text-sm font-medium text-orange-500 transition-transform duration-200 group-hover:translate-x-1">
                  Read <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </div>
          </Link>
        )}

        {/* Timeline posts */}
        {rest.length > 0 && (
          <div className="relative">
            {/* Vertical timeline line */}
            <div className="absolute top-0 bottom-0 left-[19px] w-px bg-gradient-to-b from-border via-border/60 to-transparent dark:from-white/[0.08] dark:via-white/[0.04]" />

            <div className="space-y-1">
              {rest.map((post, index) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="group relative flex gap-6 rounded-2xl py-6 pl-2 pr-4 transition-all duration-200 hover:bg-accent/30 dark:hover:bg-white/[0.02]"
                >
                  {/* Timeline node */}
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-card shadow-sm transition-all duration-200 group-hover:border-orange-500/40 group-hover:shadow-md group-hover:shadow-orange-500/10 dark:border-white/[0.08] dark:bg-zinc-900">
                      <span className="text-sm font-bold text-muted-foreground transition-colors group-hover:text-orange-500">
                        {String(rest.length - index).padStart(2, "0")}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1 pt-0.5">
                    <div className="mb-1.5 flex items-center gap-3">
                      <span className="text-[11px] font-medium text-muted-foreground/50">
                        {formatDate(post.date)}
                      </span>
                      <div className="flex gap-1">
                        {post.tags.slice(0, 3).map((tag) => {
                          const colors = TAG_COLORS[tag] ?? DEFAULT_TAG;
                          return (
                            <span
                              key={tag}
                              className={`inline-flex items-center gap-1 rounded-full ${colors.bg} px-2 py-0.5 text-[9px] font-medium ${colors.text}`}
                            >
                              <span className={`h-1 w-1 rounded-full ${colors.dot}`} />
                              {tag}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    <h3 className="mb-1 text-[15px] font-semibold text-foreground transition-colors group-hover:text-orange-500">
                      {post.title}
                    </h3>

                    <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground/70">
                      {post.excerpt}
                    </p>

                    <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-orange-500 opacity-0 transition-all duration-200 group-hover:opacity-100">
                      Read post <ArrowUpRight className="h-3 w-3" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Subscribe CTA */}
        <div className="mt-12 rounded-2xl border border-border/40 bg-gradient-to-r from-muted/30 to-muted/10 p-8 text-center dark:border-white/[0.06] dark:from-white/[0.02] dark:to-white/[0.01]">
          <p className="text-sm font-medium text-foreground">Stay in the loop</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Follow our RSS feed or star us on GitHub for updates
          </p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <a
              href="/feed.xml"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-border/50 bg-card px-4 py-2 text-xs font-medium text-foreground shadow-sm transition-all hover:shadow-md dark:border-white/[0.08]"
            >
              <Rss className="h-3.5 w-3.5 text-orange-500" />
              RSS Feed
            </a>
            <a
              href={withUtm("https://github.com/GLINCKER/thesvg", "blog_page")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl bg-foreground px-4 py-2 text-xs font-medium text-background shadow-sm transition-all hover:opacity-90"
            >
              Star on GitHub
              <ArrowUpRight className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
    </SidebarShell>
  );
}
