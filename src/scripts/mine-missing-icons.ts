/**
 * Mine missing brand icons from simpleicons + svgl.
 *
 * Pulls each upstream catalog, normalises names, diffs against our slugs and
 * aliases, and writes:
 *   docs-local/missing-icons.json   - machine-readable candidates list
 *   docs-local/missing-icons.md     - ranked report for triage
 *
 * Also pulls open icon-request issues from both repos so we can prioritise the
 * brands real users are actively asking for.
 *
 * Run:
 *   pnpm tsx src/scripts/mine-missing-icons.ts
 *
 * Optional env:
 *   GH_TOKEN  - GitHub token for higher rate limits when fetching issues
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

interface OurIcon {
  slug: string;
  title: string;
  aliases?: string[];
}

interface Candidate {
  source: "simpleicons" | "svgl" | "request";
  upstreamRepo: string;
  title: string;
  normalised: string;
  ourSlug: string;
  hex?: string;
  url?: string;
  svgSource?: string;
  license?: string;
  category?: string;
  issueNumber?: number;
  issueUrl?: string;
  signal: number;
}

const ROOT = resolve(process.cwd());
const DOCS = resolve(ROOT, "docs-local");

function normalise(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function ourSlug(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function fetchText(url: string, token?: string): Promise<string> {
  const headers: Record<string, string> = { "user-agent": "thesvg-mine-script" };
  if (token && url.includes("api.github.com")) headers["authorization"] = `Bearer ${token}`;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return res.text();
}

async function fetchJSON<T>(url: string, token?: string): Promise<T> {
  const text = await fetchText(url, token);
  return JSON.parse(text) as T;
}

function loadOurCatalog(): { byNorm: Map<string, OurIcon>; bySlug: Set<string> } {
  const data = JSON.parse(
    readFileSync(resolve(ROOT, "src/data/icons.json"), "utf8"),
  ) as OurIcon[];
  const byNorm = new Map<string, OurIcon>();
  const bySlug = new Set<string>();
  for (const icon of data) {
    bySlug.add(icon.slug);
    byNorm.set(normalise(icon.slug), icon);
    byNorm.set(normalise(icon.title), icon);
    for (const alias of icon.aliases || []) {
      byNorm.set(normalise(alias), icon);
    }
  }
  return { byNorm, bySlug };
}

interface SimpleIcon {
  title: string;
  hex: string;
  source: string;
  guidelines?: string;
  license?: { type?: string; url?: string };
  aliases?: { aka?: string[]; dup?: { title: string }[] };
}

async function mineSimpleIcons(): Promise<SimpleIcon[]> {
  const url =
    "https://raw.githubusercontent.com/simple-icons/simple-icons/develop/data/simple-icons.json";
  return fetchJSON<SimpleIcon[]>(url);
}

interface SvglIcon {
  title: string;
  category?: string | string[];
  url?: string;
  brandUrl?: string;
  route?: string | { light: string; dark: string };
}

async function mineSvgl(): Promise<SvglIcon[]> {
  const url = "https://raw.githubusercontent.com/pheralb/svgl/main/src/data/svgs.ts";
  const text = await fetchText(url);

  // The file is `export const svgs: iSVG[] = [ ... ];` with an import header.
  // Strip the import and type cast, wrap in `(JSON parse via Function)` style.
  const arrayBody = text.slice(text.indexOf("[")).replace(/;\s*$/g, "");

  // The file uses TS-ish object literals (unquoted keys, trailing commas).
  // We use Function to evaluate it as a JS expression in a sandbox-light way.
  // No untrusted input - this is a fixed upstream URL.
  // eslint-disable-next-line @typescript-eslint/no-implied-eval, no-new-func
  const evaluated = new Function(`return (${arrayBody});`)() as SvglIcon[];
  return evaluated;
}

interface IssueData {
  number: number;
  title: string;
  html_url: string;
  reactions?: { total_count?: number; "+1"?: number };
}

async function mineRequests(
  repo: string,
  filterTitle: (t: string) => string | null,
  token?: string,
): Promise<Candidate[]> {
  const sinceISO = new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString();
  const url = `https://api.github.com/repos/${repo}/issues?state=open&since=${sinceISO}&per_page=100`;
  const issues = await fetchJSON<IssueData[]>(url, token);
  const out: Candidate[] = [];
  for (const issue of issues) {
    const brand = filterTitle(issue.title);
    if (!brand) continue;
    const norm = normalise(brand);
    if (!norm) continue;
    out.push({
      source: "request",
      upstreamRepo: repo,
      title: brand,
      normalised: norm,
      ourSlug: ourSlug(brand),
      issueNumber: issue.number,
      issueUrl: issue.html_url,
      signal: (issue.reactions?.["+1"] || 0) + (issue.reactions?.total_count || 0),
    });
  }
  return out;
}

function filterSimpleIconsRequest(title: string): string | null {
  const m = title.match(/^Request:\s*(.+)$/i);
  if (!m) return null;
  return m[1].replace(/[<>]/g, "").trim();
}

function filterSvglRequest(title: string): string | null {
  const m =
    title.match(/^(?:\[Icon Request\]|Icon request:|feat:?\s*add)\s*(.+?)(?:\s+svg|\s+logo)?$/i) ||
    title.match(/^add\s+(.+)$/i);
  if (!m) return null;
  return m[1].trim();
}

async function main() {
  mkdirSync(DOCS, { recursive: true });
  const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
  const ours = loadOurCatalog();

  console.log(`[mine] our catalog: ${ours.bySlug.size} slugs`);

  const [siList, svglList, siRequests, svglRequests] = await Promise.all([
    mineSimpleIcons().catch((e) => {
      console.warn(`[mine] simpleicons failed: ${(e as Error).message}`);
      return [] as SimpleIcon[];
    }),
    mineSvgl().catch((e) => {
      console.warn(`[mine] svgl failed: ${(e as Error).message}`);
      return [] as SvglIcon[];
    }),
    mineRequests("simple-icons/simple-icons", filterSimpleIconsRequest, token).catch(
      (e) => {
        console.warn(`[mine] simpleicons issues failed: ${(e as Error).message}`);
        return [] as Candidate[];
      },
    ),
    mineRequests("pheralb/svgl", filterSvglRequest, token).catch((e) => {
      console.warn(`[mine] svgl issues failed: ${(e as Error).message}`);
      return [] as Candidate[];
    }),
  ]);

  console.log(
    `[mine] upstream: simpleicons=${siList.length}, svgl=${svglList.length}, ` +
      `simpleicons-requests=${siRequests.length}, svgl-requests=${svglRequests.length}`,
  );

  const candidates: Candidate[] = [];

  for (const icon of siList) {
    const norm = normalise(icon.title);
    if (ours.byNorm.has(norm)) continue;
    candidates.push({
      source: "simpleicons",
      upstreamRepo: "simple-icons/simple-icons",
      title: icon.title,
      normalised: norm,
      ourSlug: ourSlug(icon.title),
      hex: icon.hex,
      svgSource: icon.source,
      license: icon.license?.type,
      signal: 1,
    });
  }

  for (const icon of svglList) {
    const norm = normalise(icon.title);
    if (ours.byNorm.has(norm)) continue;
    const cat = Array.isArray(icon.category) ? icon.category.join(", ") : icon.category;
    candidates.push({
      source: "svgl",
      upstreamRepo: "pheralb/svgl",
      title: icon.title,
      normalised: norm,
      ourSlug: ourSlug(icon.title),
      url: icon.url,
      category: cat,
      signal: 1,
    });
  }

  for (const req of [...siRequests, ...svglRequests]) {
    if (ours.byNorm.has(req.normalised)) continue;
    candidates.push(req);
  }

  // Group duplicates across sources, sum signal so a brand that's wanted on
  // both repos plus appears in the catalog ranks above a single-mention one.
  const grouped = new Map<string, Candidate & { sources: Set<string> }>();
  for (const c of candidates) {
    const key = c.normalised;
    if (!key) continue;
    const existing = grouped.get(key);
    if (!existing) {
      grouped.set(key, { ...c, sources: new Set([c.source]) });
    } else {
      existing.sources.add(c.source);
      existing.signal += c.signal;
      // Keep the richest metadata
      existing.hex ??= c.hex;
      existing.svgSource ??= c.svgSource;
      existing.license ??= c.license;
      existing.url ??= c.url;
      existing.category ??= c.category;
      existing.issueNumber ??= c.issueNumber;
      existing.issueUrl ??= c.issueUrl;
    }
  }

  const ranked = [...grouped.values()].sort((a, b) => {
    if (b.signal !== a.signal) return b.signal - a.signal;
    return a.title.localeCompare(b.title);
  });

  console.log(`[mine] candidates: ${ranked.length} brands missing from our catalog`);

  // JSON dump
  const jsonOut = ranked.map(({ sources, ...rest }) => ({
    ...rest,
    sources: [...sources],
  }));
  writeFileSync(
    resolve(DOCS, "missing-icons.json"),
    JSON.stringify(jsonOut, null, 2),
  );

  // Markdown report
  const lines: string[] = [];
  lines.push(`# Missing icons — mining report`);
  lines.push("");
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push(
    `Catalog: **${ours.bySlug.size}** slugs &middot; ` +
      `Candidates: **${ranked.length}** &middot; ` +
      `simpleicons-only: **${ranked.filter((r) => r.sources.has("simpleicons") && r.sources.size === 1).length}** &middot; ` +
      `svgl-only: **${ranked.filter((r) => r.sources.has("svgl") && r.sources.size === 1).length}** &middot; ` +
      `requests-only: **${ranked.filter((r) => r.sources.has("request") && r.sources.size === 1).length}**`,
  );
  lines.push("");
  lines.push(`## Top 50 brands to import`);
  lines.push("");
  lines.push(`| Brand | Suggested slug | Sources | Hex | License | Source SVG / URL |`);
  lines.push(`|-------|----------------|---------|-----|---------|------------------|`);
  for (const r of ranked.slice(0, 50)) {
    const sources = [...r.sources].join(", ");
    const hex = r.hex ? `\`#${r.hex}\`` : "";
    const license = r.license || "";
    const link =
      r.svgSource ||
      r.url ||
      r.issueUrl ||
      "";
    const linkCell = link ? `[link](${link})` : "";
    lines.push(`| ${r.title} | \`${r.ourSlug}\` | ${sources} | ${hex} | ${license} | ${linkCell} |`);
  }
  lines.push("");
  lines.push(`## Open icon requests (last 60 days)`);
  lines.push("");
  const requests = ranked.filter((r) => r.sources.has("request"));
  if (requests.length === 0) {
    lines.push("_None._");
  } else {
    lines.push(`| Brand | Repo | Issue | Already covered? |`);
    lines.push(`|-------|------|-------|------------------|`);
    for (const r of requests) {
      lines.push(
        `| ${r.title} | ${r.upstreamRepo} | [#${r.issueNumber}](${r.issueUrl}) | ${ours.byNorm.has(r.normalised) ? "yes" : "**no**"} |`,
      );
    }
  }
  lines.push("");
  lines.push(`## How to import`);
  lines.push("");
  lines.push(
    `For each row above: fetch the source SVG, drop into ` +
      `\`public/icons/{slug}/default.svg\`, append a metadata entry to ` +
      `\`src/data/icons.json\`, then commit \`feat: add {brand} icon\`.`,
  );
  lines.push("");
  lines.push(
    `simpleicons rows ship as CC0-1.0 with a path-only mark in their brand ` +
      `colour - safe to import directly. svgl rows often include light/dark ` +
      `variants - prefer \`light.svg\` + \`dark.svg\` instead of just \`default.svg\`.`,
  );

  writeFileSync(resolve(DOCS, "missing-icons.md"), lines.join("\n") + "\n");

  console.log(`[mine] wrote ${resolve(DOCS, "missing-icons.json")}`);
  console.log(`[mine] wrote ${resolve(DOCS, "missing-icons.md")}`);
}

main().catch((e) => {
  console.error("[mine] fatal:", e);
  process.exit(1);
});
