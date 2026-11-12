/**
 * Snapshot of public GitHub repos that reference thesvg, via code search.
 * Usage: GITHUB_TOKEN=... tsx scripts/adopters-snapshot.ts
 * Env: THESVG_ADOPTERS_MAX_PAGES, THESVG_ADOPTERS_DELAY_MS, THESVG_ADOPTERS_MIN_STARS.
 */
import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import {
  classifyPaths,
  type AdopterByKind,
  type AdopterKind,
  type AdopterRepo,
  type AdoptersHistoryEntry,
  type AdoptersSnapshot,
} from "../src/lib/adopters";

const QUERIES: readonly string[] = [
  "thesvg.org/icons",
  "thesvg.org",
  "glincker/thesvg",
  "@thesvg/icons",
  "@thesvg/react",
  "@thesvg/cli",
  "cdn.jsdelivr.net/gh/glincker/thesvg",
];
const EXCLUDED_OWNERS: ReadonlySet<string> = new Set(["glincker", "thegdsks"]);

// Documented defaults. Code search allows 10 requests/min and 1000 results.
const DEFAULT_MAX_PAGES = 10;
const DEFAULT_DELAY_MS = 7000;
const DEFAULT_MIN_STARS = 10;
const PER_PAGE = 100;
const FALLBACK_WAIT_MS = 60_000;
const API = "https://api.github.com";

const METHOD =
  "GitHub code search, forks and archived repos excluded, results are capped by the API so this is a lower bound.";

function envInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 0) throw new Error(`${name} must be a non-negative integer`);
  return n;
}

const MAX_PAGES = envInt("THESVG_ADOPTERS_MAX_PAGES", DEFAULT_MAX_PAGES);
const DELAY_MS = envInt("THESVG_ADOPTERS_DELAY_MS", DEFAULT_DELAY_MS);
const MIN_STARS = envInt("THESVG_ADOPTERS_MIN_STARS", DEFAULT_MIN_STARS);

const token = process.env.GITHUB_TOKEN;
if (!token) throw new Error("GITHUB_TOKEN is required");

function log(msg: string): void {
  process.stdout.write(`${msg}\n`);
}

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

async function gh(url: string): Promise<Response> {
  const init = {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "thesvg-adopters-snapshot",
    },
  };
  let res = await fetch(url, init);
  if (res.status === 403 || res.status === 429) {
    const retryAfter = Number(res.headers.get("retry-after"));
    const waitMs =
      Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : FALLBACK_WAIT_MS;
    log(`rate limited (${res.status}), waiting ${Math.ceil(waitMs / 1000)}s`);
    await sleep(waitMs);
    res = await fetch(url, init);
  }
  return res;
}

interface CodeSearchItem {
  path: string;
  repository: { full_name: string; owner: { login: string } };
}
interface CodeSearchResponse {
  total_count: number;
  items: CodeSearchItem[];
}
interface RepoMeta {
  full_name: string;
  stargazers_count: number;
  fork: boolean;
  archived: boolean;
  description: string | null;
  homepage: string | null;
  html_url: string;
  default_branch: string;
}

// repo full_name -> matched paths
async function collectMatches(): Promise<Map<string, string[]>> {
  const matches = new Map<string, string[]>();
  let first = true;
  for (const query of QUERIES) {
    for (let page = 1; page <= MAX_PAGES; page++) {
      if (!first) await sleep(DELAY_MS);
      first = false;
      const url = `${API}/search/code?q=${encodeURIComponent(`"${query}"`)}&per_page=${PER_PAGE}&page=${page}`;
      const res = await gh(url);
      if (!res.ok) {
        log(`query "${query}" page ${page}: HTTP ${res.status}, stopping this query`);
        break;
      }
      const body = (await res.json()) as CodeSearchResponse;
      for (const item of body.items) {
        const name = item.repository.full_name;
        if (EXCLUDED_OWNERS.has(item.repository.owner.login.toLowerCase())) continue;
        const paths = matches.get(name) ?? [];
        paths.push(item.path);
        matches.set(name, paths);
      }
      log(
        `query "${query}" page ${page}: ${body.items.length} items (total ${body.total_count}), ${matches.size} repos so far`
      );
      if (body.items.length < PER_PAGE || page * PER_PAGE >= body.total_count) break;
    }
  }
  return matches;
}

async function fetchMeta(fullName: string): Promise<RepoMeta | null> {
  const res = await gh(`${API}/repos/${fullName}`);
  if (!res.ok) return null;
  return (await res.json()) as RepoMeta;
}

function readHistory(path: string): AdoptersHistoryEntry[] {
  if (!existsSync(path)) return [];
  return JSON.parse(readFileSync(path, "utf-8")) as AdoptersHistoryEntry[];
}

async function main(): Promise<void> {
  const matches = await collectMatches();
  const byKind: AdopterByKind = { dependency: 0, code: 0, docs: 0 };
  const listed: AdopterRepo[] = [];

  for (const [fullName, paths] of matches) {
    const kind: AdopterKind | null = classifyPaths(paths);
    if (kind === null) continue;
    const meta = await fetchMeta(fullName);
    if (!meta || meta.fork || meta.archived) continue;
    byKind[kind] += 1;
    if (meta.stargazers_count >= MIN_STARS) {
      listed.push({
        repo: meta.full_name,
        url: meta.html_url,
        stars: meta.stargazers_count,
        kind,
        description: meta.description ?? "",
      });
    }
  }

  listed.sort((a, b) => b.stars - a.stars || a.repo.localeCompare(b.repo));
  const total = byKind.dependency + byKind.code + byKind.docs;
  const now = new Date();
  const snapshot: AdoptersSnapshot = {
    generatedAt: now.toISOString(),
    method: METHOD,
    total,
    byKind,
    repos: listed,
  };

  const dataDir = join(__dirname, "../src/data");
  writeFileSync(join(dataDir, "adopters.json"), `${JSON.stringify(snapshot, null, 2)}\n`, "utf-8");

  const historyPath = join(dataDir, "adopters-history.json");
  const date = now.toISOString().slice(0, 10);
  const history = readHistory(historyPath).filter((h) => h.date !== date);
  history.push({ date, total, byKind });
  history.sort((a, b) => a.date.localeCompare(b.date));
  writeFileSync(historyPath, `${JSON.stringify(history, null, 2)}\n`, "utf-8");

  log(
    `total ${total} (dependency ${byKind.dependency}, code ${byKind.code}, docs ${byKind.docs}), listed ${listed.length}`
  );
}

main().catch((err: unknown) => {
  process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
