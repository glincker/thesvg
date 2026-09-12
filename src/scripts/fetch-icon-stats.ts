/**
 * fetch-icon-stats.ts
 *
 * Pulls aggregate icon_feedback tallies out of PostHog (via the HogQL Query
 * API) and writes them to public/data/icon-stats.json as a static snapshot
 * the (statically-exported) site can fetch client-side. This is the "read
 * side" of the thumbs-up/down widget in
 * src/components/icons/detail/icon-feedback.tsx, which fires the raw
 * `icon_feedback` event with { slug, sentiment } properties.
 *
 * Run with:
 *   tsx src/scripts/fetch-icon-stats.ts
 *
 * Requires POSTHOG_PERSONAL_API_KEY in the environment - a secret Personal
 * API Key with "Query Read" access, generated at
 * https://us.posthog.com/settings/user-api-keys. This is fundamentally
 * different from NEXT_PUBLIC_POSTHOG_KEY (the public write-only key used
 * client-side) and must never be exposed to the browser.
 *
 * On any failure (missing/invalid key, network error, malformed response)
 * this script logs a clear, actionable error and exits non-zero WITHOUT
 * touching the existing public/data/icon-stats.json - a failed run leaves
 * the last-known-good snapshot in place instead of overwriting it with
 * empty/broken data.
 */

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

/** thesvg's PostHog project ID (us.posthog.com/project/335675). */
const PROJECT_ID = process.env.POSTHOG_PROJECT_ID || "335675";
const POSTHOG_HOST = process.env.POSTHOG_HOST || "https://us.i.posthog.com";
const QUERY_URL = `${POSTHOG_HOST}/api/projects/${PROJECT_ID}/query`;

const OUTPUT_PATH = join(__dirname, "../../public/data/icon-stats.json");

/** 15s client-side timeout - PostHog's own HogQL execution cap is 10s. */
const REQUEST_TIMEOUT_MS = 15_000;

const HOGQL_QUERY = `
  SELECT
    properties.slug AS slug,
    countIf(properties.sentiment = 'up') AS up_count,
    countIf(properties.sentiment = 'down') AS down_count
  FROM events
  WHERE event = 'icon_feedback'
    AND properties.slug IS NOT NULL
  GROUP BY slug
  ORDER BY slug
  LIMIT 10000
`.trim();

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface IconStats {
  generatedAt: string;
  feedback: Record<string, { up: number; down: number }>;
}

interface HogQLQueryResponse {
  results?: unknown;
  columns?: unknown;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fail(message: string): never {
  console.error(`[fetch-icon-stats] ${message}`);
  console.error(
    "[fetch-icon-stats] Existing public/data/icon-stats.json was left untouched."
  );
  process.exit(1);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Coerces a ClickHouse-returned count, which may arrive as a number or a
 * numeric string (ClickHouse serializes UInt64 as a string to avoid JS
 * precision loss), into a safe integer. */
function toCount(value: unknown): number | null {
  const n = typeof value === "string" ? Number(value) : value;
  if (typeof n !== "number" || !Number.isFinite(n) || n < 0) return null;
  return Math.trunc(n);
}

interface RawRow {
  slugRaw: unknown;
  upRaw: unknown;
  downRaw: unknown;
}

/** Extracts the three raw column values from an array-shaped row, using the
 * `columns` list to find the right index when present (column order isn't
 * guaranteed to match the SELECT list verbatim), falling back to positional
 * access otherwise. */
function extractFromArrayRow(row: unknown[], columns: string[] | null): RawRow {
  if (columns?.length === row.length) {
    const slugIdx = columns.indexOf("slug");
    const upIdx = columns.indexOf("up_count");
    const downIdx = columns.indexOf("down_count");
    return {
      slugRaw: slugIdx >= 0 ? row[slugIdx] : row[0],
      upRaw: upIdx >= 0 ? row[upIdx] : row[1],
      downRaw: downIdx >= 0 ? row[downIdx] : row[2],
    };
  }
  const [slugRaw, upRaw, downRaw] = row;
  return { slugRaw, upRaw, downRaw };
}

/**
 * Normalizes one result row into { slug, up, down }. The HogQL Query API's
 * documented response shape is `results: any[][]` (rows as arrays, in the
 * same order as the SELECT list) - but we defensively also accept a
 * row-as-object shape (keyed by column alias) in case that ever changes,
 * rather than crashing the whole run over a shape mismatch.
 */
function normalizeRow(
  row: unknown,
  columns: string[] | null
): { slug: string; up: number; down: number } | null {
  let raw: RawRow;
  if (Array.isArray(row)) {
    raw = extractFromArrayRow(row, columns);
  } else if (isRecord(row)) {
    raw = { slugRaw: row.slug, upRaw: row.up_count, downRaw: row.down_count };
  } else {
    return null;
  }

  if (typeof raw.slugRaw !== "string" || raw.slugRaw.length === 0) return null;
  const up = toCount(raw.upRaw);
  const down = toCount(raw.downRaw);
  if (up === null || down === null) return null;

  return { slug: raw.slugRaw, up, down };
}

// ---------------------------------------------------------------------------
// Query execution (split out of main() to keep each step's branching small)
// ---------------------------------------------------------------------------

function requireApiKey(): string {
  const apiKey = process.env.POSTHOG_PERSONAL_API_KEY;
  if (!apiKey) {
    fail(
      "POSTHOG_PERSONAL_API_KEY is missing. Generate a Personal API Key with " +
        "'Query Read' access at https://us.posthog.com/settings/user-api-keys " +
        "and set it as a GitHub Actions repository secret named " +
        "POSTHOG_PERSONAL_API_KEY (or in your local shell env to run this script " +
        "manually)."
    );
  }
  return apiKey;
}

async function queryPostHog(apiKey: string): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(QUERY_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: { kind: "HogQLQuery", query: HOGQL_QUERY },
        name: "icon_feedback_tallies",
      }),
      signal: controller.signal,
    });
  } catch (error) {
    fail(
      `Network error while querying PostHog: ${
        error instanceof Error ? error.message : String(error)
      }. Check connectivity to ${POSTHOG_HOST} and retry.`
    );
  } finally {
    clearTimeout(timeout);
  }
}

async function assertOk(response: Response): Promise<void> {
  if (response.ok) return;

  let bodyText = "";
  try {
    bodyText = await response.text();
  } catch {
    // ignore - we still have the status code to report
  }

  if (response.status === 401 || response.status === 403) {
    fail(
      `PostHog rejected the request (HTTP ${response.status}). ` +
        "POSTHOG_PERSONAL_API_KEY is missing, invalid, or lacks 'Query Read' " +
        "scope. Generate a new key at " +
        "https://us.posthog.com/settings/user-api-keys and update the " +
        `POSTHOG_PERSONAL_API_KEY secret. Response body: ${bodyText.slice(0, 500)}`
    );
  }

  fail(
    `PostHog query failed (HTTP ${response.status}). Response body: ` +
      `${bodyText.slice(0, 500)}`
  );
}

async function parseQueryResponse(
  response: Response
): Promise<{ results: unknown[]; columns: string[] | null }> {
  let json: unknown;
  try {
    json = await response.json();
  } catch (error) {
    fail(
      `PostHog returned a non-JSON response: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }

  if (!isRecord(json)) {
    fail("PostHog response was not a JSON object; cannot parse query results.");
  }

  const parsed = json as HogQLQueryResponse;
  const { results } = parsed;

  if (results === undefined || results === null) {
    fail(
      "PostHog response had no 'results' field. Full response: " +
        JSON.stringify(json).slice(0, 500)
    );
  }
  if (!Array.isArray(results)) {
    fail(
      "PostHog response 'results' field was not an array; unexpected query " +
        `response shape. Full response: ${JSON.stringify(json).slice(0, 500)}`
    );
  }

  const columns = Array.isArray(parsed.columns)
    ? parsed.columns.filter((c): c is string => typeof c === "string")
    : null;

  return { results, columns };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const apiKey = requireApiKey();
  const response = await queryPostHog(apiKey);
  await assertOk(response);
  const { results, columns } = await parseQueryResponse(response);

  const feedback: IconStats["feedback"] = {};
  let skipped = 0;

  for (const row of results) {
    const normalized = normalizeRow(row, columns);
    if (!normalized) {
      skipped += 1;
      continue;
    }
    if (normalized.up === 0 && normalized.down === 0) continue;
    feedback[normalized.slug] = { up: normalized.up, down: normalized.down };
  }

  if (skipped > 0) {
    console.warn(
      `[fetch-icon-stats] Skipped ${skipped} row(s) with an unrecognized shape.`
    );
  }

  // Empty results is expected (feature just shipped) - not an error.
  const stats: IconStats = {
    generatedAt: new Date().toISOString(),
    feedback,
  };

  const outDir = dirname(OUTPUT_PATH);
  if (!existsSync(outDir)) {
    mkdirSync(outDir, { recursive: true });
  }
  writeFileSync(OUTPUT_PATH, `${JSON.stringify(stats, null, 2)}\n`, "utf-8");

  const slugCount = Object.keys(feedback).length;
  console.log(
    `[fetch-icon-stats] Wrote public/data/icon-stats.json with ${slugCount} ` +
      `slug(s) of feedback.`
  );
}

main().catch((error) => {
  fail(
    `Unexpected error: ${error instanceof Error ? error.stack ?? error.message : String(error)}`
  );
});
