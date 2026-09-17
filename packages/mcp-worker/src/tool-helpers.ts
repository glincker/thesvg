// Small shared shape-builders for CallToolResult, used by every tool in
// index.ts. Pulled out mainly to avoid repeating the same
// `{ content: [{ type: "text", text }] , isError }` object literal in every
// handler (five tools times several branches each adds up fast).

import { findIcon, type IconEntry } from "./icons-data";

export interface TextToolResult {
  [key: string]: unknown;
  content: { type: "text"; text: string }[];
  isError?: true;
}

export function textResult(text: string): TextToolResult {
  return { content: [{ type: "text", text }] };
}

export function errorResult(text: string): TextToolResult {
  return { content: [{ type: "text", text }], isError: true };
}

export function iconNotFoundResult(slug: string): TextToolResult {
  return errorResult(
    `Icon not found: "${slug}". Use search_icons to find the correct slug.`
  );
}

export type IconLookup =
  | { ok: true; icon: IconEntry }
  | { ok: false; result: TextToolResult };

/**
 * Looks up an icon by slug, returning either the icon or a ready-to-return
 * "not found" tool result. get_icon, list_variants, and get_icon_url all
 * start with this exact check; centralizing it here is what let those three
 * handlers drop to a single `if (!found.ok) return found.result;` line each.
 */
export function findIconOrNotFound(slug: string): IconLookup {
  const icon = findIcon(slug);
  return icon ? { ok: true, icon } : { ok: false, result: iconNotFoundResult(slug) };
}
