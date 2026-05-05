#!/usr/bin/env node
/**
 * Triage an icon-request or icon-update issue.
 *
 * Reads the issue payload from $GITHUB_EVENT_PATH and src/data/icons.json
 * from the checked-out repo, then writes:
 *  - a JSON decision file at $TRIAGE_OUTPUT (labels, comment body, slug, status)
 *
 * The workflow consumes that JSON and applies the labels + comment.
 *
 * No npm dependencies. Pure Node 20.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const KIND_REQUEST = "icon-request";
const KIND_UPDATE = "icon-update";

const STATUS_LABEL = {
  ready: "triage:ready",
  needsSvg: "triage:needs-svg",
  needsLicense: "triage:needs-license",
  oversize: "triage:svg-oversize",
  invalidSvg: "triage:invalid-svg",
  duplicate: "duplicate",
};

const KNOWN_CATEGORY_SLUGS = new Set([
  "ai", "analytics", "auth", "browser", "cms", "cloud", "communication",
  "crypto", "database", "design", "devtool", "e-commerce", "education",
  "entertainment", "finance", "framework", "gaming", "hardware", "hosting",
  "language", "library", "messaging", "music", "os", "other", "productivity",
  "security", "social", "storage", "vcs", "platform", "software",
  "app-services", "transportation", "booking", "mobile-app",
]);

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function detectKind(issue) {
  const labels = (issue.labels || []).map((l) => (typeof l === "string" ? l : l.name));
  const title = (issue.title || "").toLowerCase();
  if (labels.includes("icon-update") || title.startsWith("icon update")) return KIND_UPDATE;
  if (
    labels.includes("icon-request") ||
    labels.includes("icons") ||
    title.startsWith("icon request") ||
    title.startsWith("[icon request]")
  ) {
    return KIND_REQUEST;
  }
  return null;
}

/**
 * Lift fields out of an issue body. Templates use both `### Heading` and
 * `**Heading**:` styles. We try multiple patterns and stop at the first hit.
 */
function stripCommentsAndPlaceholders(text) {
  if (!text) return text;
  return text
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/^\s*(?:_)?(?:placeholder|e\.g\.?|example).*$/gim, "")
    .trim();
}

function getField(body, label) {
  if (!body) return null;
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp(`(?:^|\\n)#{1,6}\\s*${escaped}\\s*\\n+([\\s\\S]*?)(?=\\n#{1,6}\\s|\\n---|$)`, "i"),
    new RegExp(`\\*\\*${escaped}\\*\\*\\s*[:\\-]?\\s*([^\\n]+)`, "i"),
    new RegExp(`-\\s*\\*\\*${escaped}\\*\\*\\s*[:\\-]?\\s*([^\\n]+)`, "i"),
  ];
  for (const re of patterns) {
    const m = body.match(re);
    if (m && m[1]) {
      const cleaned = stripCommentsAndPlaceholders(m[1]);
      if (cleaned) return cleaned;
    }
  }
  return null;
}

function extractFirstSvg(body) {
  if (!body) return null;
  const fence = body.match(/```(?:svg|xml|html)?\s*\n([\s\S]*?<svg[\s\S]*?<\/svg>[\s\S]*?)\n```/i);
  if (fence) return fence[1].trim();
  const inline = body.match(/<svg[\s\S]*?<\/svg>/i);
  if (inline) return inline[0];
  const html = body.match(/<!--\s*([\s\S]*?<svg[\s\S]*?<\/svg>[\s\S]*?)-->/i);
  if (html) return html[1].trim();
  return null;
}

function validateSvg(svg) {
  const errors = [];
  if (!svg) return { ok: false, errors: ["no SVG content found"], bytes: 0 };
  const bytes = Buffer.byteLength(svg, "utf8");
  if (bytes > 50 * 1024) errors.push(`SVG is ${(bytes / 1024).toFixed(1)}KB (50KB max)`);
  if (!/<svg[\s>]/i.test(svg)) errors.push("missing <svg> root");
  if (!/viewBox\s*=\s*["'][^"']+["']/i.test(svg)) errors.push("missing viewBox");
  if (/<script\b/i.test(svg)) errors.push("contains <script> tag");
  if (/\son\w+\s*=/i.test(svg)) errors.push("contains inline event handler");
  if (/data:image\/(png|jpe?g|gif|webp);base64/i.test(svg)) errors.push("embeds raster image");
  if (/created by svgstack|attribution is required/i.test(svg)) {
    errors.push("contains third-party attribution watermark");
  }
  return { ok: errors.length === 0, errors, bytes };
}

/**
 * Submitters often paste a ready-made icons.json entry inside a fenced
 * ```json``` block. The form template doesn't have a License field, so we
 * fall back to lifting the value out of that snippet (often "TODO" while
 * the submitter waits for a maintainer to pick a value).
 */
function extractLicenseFromJsonSnippet(body) {
  if (!body) return null;
  const fence = body.match(/```json\s*\n([\s\S]*?)\n```/i);
  if (!fence) return null;
  try {
    const parsed = JSON.parse(fence[1]);
    if (parsed && typeof parsed.license === "string") return parsed.license.trim();
  } catch {
    // fenced block isn't valid JSON, fall through
  }
  const m = fence[1].match(/"license"\s*:\s*"([^"]+)"/i);
  return m ? m[1].trim() : null;
}

function parseHex(value) {
  if (!value) return null;
  const m = value.match(/#?([0-9a-fA-F]{3,8})/);
  if (!m) return null;
  const raw = m[1];
  if (raw.length === 3 || raw.length === 6 || raw.length === 8) return raw.toUpperCase();
  return null;
}

function readIcons() {
  const path = resolve(process.cwd(), "src/data/icons.json");
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (e) {
    console.warn("[triage] could not read icons.json:", e.message);
    return [];
  }
}

function buildComment({ kind, name, slug, hex, categories, svgCheck, license, dup }) {
  const lines = [];
  lines.push(`### Auto-triage`);
  lines.push("");
  if (dup) {
    lines.push(`> Heads up: there is already an icon with slug \`${slug}\`. If this is a request to **update** the existing icon, please switch to the [Icon Update](../../issues/new?template=icon_update.yml) template.`);
    lines.push("");
  }
  lines.push("**Parsed**");
  if (name) lines.push(`- Brand: \`${name}\``);
  if (slug) lines.push(`- Slug: \`${slug}\``);
  if (hex) lines.push(`- Hex: \`#${hex}\``);
  if (categories.length) lines.push(`- Categories: ${categories.map((c) => `\`${c}\``).join(", ")}`);
  if (license) lines.push(`- License: \`${license}\``);
  lines.push("");
  lines.push("**SVG check**");
  if (kind === KIND_REQUEST || svgCheck.bytes > 0) {
    if (svgCheck.bytes > 0) lines.push(`- Size: ${(svgCheck.bytes / 1024).toFixed(1)}KB`);
    if (svgCheck.ok) {
      lines.push(`- ✓ Passes the basic checks (root element, viewBox, no scripts, no rasters).`);
    } else {
      lines.push(`- ✗ Issues:`);
      svgCheck.errors.forEach((e) => lines.push(`  - ${e}`));
    }
  } else {
    lines.push("- (no SVG provided — fine for an update issue if you've described the change)");
  }
  lines.push("");
  lines.push("**Maintainer notes**");
  lines.push("- Brand check: confirm the SVG matches the official press kit / asset URL.");
  lines.push("- Trademark: check whether the brand restricts third-party redistribution before merging.");
  lines.push("- License: pick `CC0-1.0`, `MIT`, `brand-use`, or the brand's actual license.");
  lines.push("");
  lines.push(`<sub>This comment was generated by the icon-triage workflow.</sub>`);
  return lines.join("\n");
}

function main() {
  const eventPath = process.env.GITHUB_EVENT_PATH;
  const outPath = process.env.TRIAGE_OUTPUT || resolve(process.cwd(), "triage-output.json");
  if (!eventPath) throw new Error("GITHUB_EVENT_PATH not set");

  const event = JSON.parse(readFileSync(eventPath, "utf8"));
  const issue = event.issue;
  if (!issue) {
    console.log("[triage] no issue payload, skipping");
    writeFileSync(outPath, JSON.stringify({ skipped: true, reason: "no-issue" }));
    return;
  }

  const kind = detectKind(issue);
  if (!kind) {
    console.log("[triage] not an icon issue, skipping");
    writeFileSync(outPath, JSON.stringify({ skipped: true, reason: "not-icon" }));
    return;
  }

  const body = issue.body || "";
  const name =
    getField(body, "Brand Name") ||
    getField(body, "Name") ||
    issue.title.replace(/^\[?icon (request|update)\]?:?/i, "").trim();
  const explicitSlug = getField(body, "Slug");
  const slug = slugify(explicitSlug || name);

  const hex = parseHex(getField(body, "Brand Hex Color") || getField(body, "Hex"));
  const categoriesRaw = getField(body, "Categories") || getField(body, "Category") || "";
  const categories = categoriesRaw
    .split(/[,/\n]/)
    .map((s) => s.replace(/[`\-*]/g, "").trim())
    .filter(Boolean)
    .filter((s) => s !== "-" && s.toLowerCase() !== "todo");

  const license = getField(body, "License") || extractLicenseFromJsonSnippet(body);
  const svg = extractFirstSvg(body);
  const svgCheck = validateSvg(svg);

  const icons = readIcons();
  const slugSet = new Set(icons.map((i) => i.slug));
  const dup = slug && slugSet.has(slug);

  const labels = ["icons"];
  if (kind === KIND_REQUEST) labels.push("icon-request");
  if (kind === KIND_UPDATE) labels.push("icon-update");
  for (const cat of categories) {
    const cs = slugify(cat);
    if (KNOWN_CATEGORY_SLUGS.has(cs)) labels.push(`category:${cs}`);
  }
  if (dup && kind === KIND_REQUEST) labels.push(STATUS_LABEL.duplicate);
  if (kind === KIND_REQUEST && !svg) labels.push(STATUS_LABEL.needsSvg);
  if (svg && !svgCheck.ok) {
    const oversize = svgCheck.errors.some((e) => e.includes("50KB"));
    const otherErrors = svgCheck.errors.some((e) => !e.includes("50KB"));
    if (oversize) labels.push(STATUS_LABEL.oversize);
    if (otherErrors) labels.push(STATUS_LABEL.invalidSvg);
  }
  if (kind === KIND_REQUEST && license && /^todo$/i.test(license.trim())) {
    labels.push(STATUS_LABEL.needsLicense);
  }
  if (
    kind === KIND_REQUEST &&
    !dup &&
    svg &&
    svgCheck.ok &&
    license &&
    !/^todo$/i.test(license.trim())
  ) {
    labels.push(STATUS_LABEL.ready);
  }

  const comment = buildComment({ kind, name, slug, hex, categories, svgCheck, license, dup });

  const decision = {
    skipped: false,
    issue: issue.number,
    kind,
    slug,
    duplicate: dup,
    labels: Array.from(new Set(labels)),
    comment,
  };

  writeFileSync(outPath, JSON.stringify(decision, null, 2));
  console.log(`[triage] decision written to ${outPath}`);
  console.log(JSON.stringify(decision, null, 2));
}

main();
