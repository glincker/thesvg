import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, Link2, Tag } from "lucide-react";
import { ShareButtons } from "@/components/blog/share-buttons";
import { SidebarShell } from "@/components/layout/sidebar-shell";
import { getCategoryCounts } from "@/lib/icons";
import postsData from "@/data/posts.json";

interface Post {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  author: string;
  tags: string[];
  body: string;
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

const posts = postsData as Post[];

export function generateStaticParams() {
  return posts.map((post) => ({ slug: post.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = posts.find((p) => p.slug === slug);
  if (!post) return {};

  return {
    title: post.title,
    description: post.excerpt,
    keywords: [
      ...post.tags,
      "theSVG blog",
      "SVG icon library",
      "open source icons",
      "developer tools",
    ],
    openGraph: {
      title: `${post.title} | theSVG Blog`,
      description: post.excerpt,
      url: `https://thesvg.org/blog/${slug}`,
      type: "article",
      publishedTime: post.date,
      authors: [post.author],
      siteName: "theSVG",
      section: post.tags[0],
      tags: post.tags,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
    },
    alternates: {
      canonical: `https://thesvg.org/blog/${slug}`,
    },
  };
}

function processInline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-foreground">$1</strong>')
    .replace(
      /`(.+?)`/g,
      '<code class="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] dark:bg-white/[0.06]">$1</code>'
    )
    .replace(
      /\[(.+?)\]\((.+?)\)/g,
      '<a href="$2" class="text-orange-500 underline underline-offset-2 hover:text-orange-400">$1</a>'
    );
}

function renderMarkdown(body: string): string {
  return body
    .split("\n\n")
    .map((block) => {
      if (block.startsWith("## ")) {
        return `<h2 class="mt-8 mb-3 text-xl font-bold tracking-tight text-foreground">${block.slice(3)}</h2>`;
      }
      if (block.startsWith("```")) {
        const lines = block.split("\n");
        const code = lines.slice(1, -1).join("\n");
        return `<pre class="my-4 overflow-x-auto rounded-xl border border-border/40 bg-muted/30 p-4 font-mono text-xs text-foreground dark:border-white/[0.06] dark:bg-white/[0.03]"><code>${code.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre>`;
      }
      if (block.includes("\n- ")) {
        const items = block.split("\n").filter((l) => l.startsWith("- "));
        const listHtml = items
          .map(
            (item) =>
              `<li class="ml-4 text-sm leading-relaxed text-muted-foreground">${processInline(item.slice(2))}</li>`
          )
          .join("");
        return `<ul class="my-3 list-disc space-y-1.5 pl-2">${listHtml}</ul>`;
      }
      if (block.includes("|") && block.includes("---")) {
        const rows = block.split("\n").filter((r) => r.includes("|") && !r.includes("---"));
        if (rows.length < 2) {
          return `<p class="my-3 text-sm leading-relaxed text-muted-foreground">${processInline(block)}</p>`;
        }
        const header = rows[0].split("|").filter(Boolean).map((c) => c.trim());
        const bodyRows = rows.slice(1);
        const headerHtml = header
          .map(
            (h) =>
              `<th class="border border-border/30 px-3 py-2 text-left text-xs font-semibold text-foreground dark:border-white/[0.06]">${processInline(h)}</th>`
          )
          .join("");
        const bodyHtml = bodyRows
          .map((row) => {
            const cells = row.split("|").filter(Boolean).map((c) => c.trim());
            return `<tr>${cells
              .map(
                (c) =>
                  `<td class="border border-border/30 px-3 py-2 text-xs text-muted-foreground dark:border-white/[0.06]">${processInline(c)}</td>`
              )
              .join("")}</tr>`;
          })
          .join("");
        return `<div class="my-4 overflow-x-auto rounded-xl border border-border/40 dark:border-white/[0.06]"><table class="w-full border-collapse"><thead><tr class="bg-muted/30 dark:bg-white/[0.03]">${headerHtml}</tr></thead><tbody>${bodyHtml}</tbody></table></div>`;
      }
      return `<p class="my-3 text-sm leading-relaxed text-muted-foreground">${processInline(block)}</p>`;
    })
    .join("");
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = posts.find((p) => p.slug === slug);
  if (!post) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    author: { "@type": "Organization", name: post.author },
    publisher: { "@type": "Organization", name: "theSVG", url: "https://thesvg.org" },
    url: `https://thesvg.org/blog/${slug}`,
    isPartOf: { "@type": "WebSite", name: "theSVG", url: "https://thesvg.org" },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SidebarShell categoryCounts={getCategoryCounts()}>
        <div className="mx-auto max-w-2xl px-4 py-8">
          <article>
            <Link
              href="/blog"
              className="mb-6 inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-3 w-3" />
              Back to blog
            </Link>

              <header className="mb-8">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(post.date).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                  <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                  <span>{post.author}</span>
                </div>
            <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
              {post.title}
            </h1>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-full bg-orange-500/10 px-2.5 py-0.5 text-[10px] font-medium text-orange-500"
                >
                  <Tag className="h-2.5 w-2.5" />
                  {tag}
                </span>
              ))}
            </div>
          </header>

          {/* Body with sticky share sidebar */}
          <div className="relative">
            {/* Share bar - floats in the right margin, starts at body level */}
            <div className="pointer-events-none absolute -right-16 top-0 bottom-0 hidden w-12 xl:block">
              <div className="pointer-events-auto sticky top-24">
                <ShareButtons
                  url={`https://thesvg.org/blog/${slug}`}
                  title={post.title}
                  tags={post.tags}
                  vertical
                />
              </div>
            </div>

            <div dangerouslySetInnerHTML={{ __html: renderMarkdown(post.body) }} />

          </div>

          <div className="mt-8 border-t border-border/40 pt-6 dark:border-white/[0.06]">
            <Link
              href="/blog"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-orange-500 transition-colors hover:text-orange-400"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              All posts
            </Link>
          </div>

          {/* Mobile share bar */}
          <div className="mt-6 xl:hidden">
            <ShareButtons
              url={`https://thesvg.org/blog/${slug}`}
              title={post.title}
              tags={post.tags}
            />
          </div>
          </article>
        </div>
      </SidebarShell>
    </>
  );
}
