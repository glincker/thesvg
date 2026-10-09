/**
 * GitHub star count for the header button.
 *
 * The site is a static export, so the count has two sources: a value fetched
 * at build time (so the first paint already has a number) and a cached
 * browser refresh (so it does not go stale between deploys). Both fail soft:
 * with no number the button simply renders without the count.
 */

export const GITHUB_REPO = "GLINCKER/thesvg";
export const GITHUB_REPO_API = `https://api.github.com/repos/${GITHUB_REPO}`;

/** 1234 -> "1.2k", 12345 -> "12k", 987 -> "987". */
export function formatStarCount(count: number): string {
  if (!Number.isFinite(count) || count < 0) return "";
  if (count < 1000) return String(Math.round(count));
  if (count < 10_000) return `${(Math.floor(count / 100) / 10).toFixed(1).replace(/\.0$/, "")}k`;
  if (count < 1_000_000) return `${Math.floor(count / 1000)}k`;
  return `${(Math.floor(count / 100_000) / 10).toFixed(1).replace(/\.0$/, "")}m`;
}

/** Reads `stargazers_count` out of a GitHub repo API payload, or null. */
export function parseStarCount(payload: unknown): number | null {
  if (typeof payload !== "object" || payload === null) return null;
  const value = (payload as { stargazers_count?: unknown }).stargazers_count;
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
}

/** Build-time fetch. Uses GITHUB_TOKEN when present to avoid anonymous rate limits. */
export async function fetchRepoStars(): Promise<number | null> {
  try {
    const token = process.env.GITHUB_TOKEN;
    const res = await fetch(GITHUB_REPO_API, {
      // Static export: resolve once at build time.
      cache: "force-cache",
      headers: {
        Accept: "application/vnd.github+json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!res.ok) return null;
    return parseStarCount(await res.json());
  } catch {
    return null;
  }
}
