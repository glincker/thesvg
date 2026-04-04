import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

interface Post {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  author: string;
  tags: string[];
  body: string;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

const postsPath = join(__dirname, "../src/data/posts.json");
const posts = (JSON.parse(readFileSync(postsPath, "utf-8")) as Post[]).sort(
  (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
);

const items = posts
  .map(
    (post) => `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>https://thesvg.org/blog/${post.slug}</link>
      <guid isPermaLink="true">https://thesvg.org/blog/${post.slug}</guid>
      <description>${escapeXml(post.excerpt)}</description>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
      <author>team@thesvg.org (${post.author})</author>
      ${post.tags.map((t) => `<category>${escapeXml(t)}</category>`).join("\n      ")}
    </item>`
  )
  .join("\n");

const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>theSVG Blog</title>
    <link>https://thesvg.org/blog</link>
    <description>Announcements, releases, and updates from theSVG - the open SVG brand library</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="https://thesvg.org/feed.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;

const outPath = join(__dirname, "../public/feed.xml");
writeFileSync(outPath, rss, "utf-8");
console.log(`Generated feed.xml with ${posts.length} posts`);
