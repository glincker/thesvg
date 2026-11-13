export const dynamic = "force-static";

// Written by hand instead of metadata robots.ts, which cannot emit the Content-Signal directive.
// The signals state that search, AI answers and model training are all welcome for this open icon library.
const BODY = `User-Agent: *
Content-Signal: search=yes, ai-input=yes, ai-train=yes
Allow: /

User-Agent: GPTBot
User-Agent: Claude-Web
User-Agent: Amazonbot
User-Agent: PerplexityBot
User-Agent: anthropic-ai
Allow: /
Allow: /llms.txt

Sitemap: https://thesvg.org/sitemap.xml
`;

export function GET(): Response {
  return new Response(BODY, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
