/**
 * Utilities shared by the SVG viewer and any other surface that wants to
 * format, measure, or deep-link an SVG document (icon detail page, etc.).
 *
 * Browser-only: relies on DOMParser and `Blob`.
 */

export interface SvgMetrics {
  bytes: number;
  width: string | null;
  height: string | null;
  viewBox: string | null;
  elementCount: number;
  hasGradients: boolean;
  hasMasks: boolean;
  rootFill: string | null;
}

export function isLikelySvg(text: string): boolean {
  const trimmed = text.trim();
  return /^<svg[\s>]/i.test(trimmed) && /<\/svg>\s*$/i.test(trimmed);
}

export function computeSvgMetrics(source: string): SvgMetrics | null {
  if (typeof window === "undefined") return null;
  if (!isLikelySvg(source)) return null;
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(source, "image/svg+xml");
    const root = doc.documentElement;
    if (root.nodeName.toLowerCase() !== "svg") return null;
    return {
      bytes: new Blob([source]).size,
      width: root.getAttribute("width"),
      height: root.getAttribute("height"),
      viewBox: root.getAttribute("viewBox"),
      elementCount: doc.querySelectorAll("*").length - 1,
      hasGradients:
        doc.querySelectorAll("linearGradient, radialGradient").length > 0,
      hasMasks: doc.querySelectorAll("mask, clipPath").length > 0,
      rootFill: root.getAttribute("fill"),
    };
  } catch {
    return null;
  }
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Pretty-print SVG/XML with 2-space indentation. Handles self-closing tags,
 * processing instructions (<?...?>), comments (<!--...-->), and CDATA blocks
 * by treating them as atomic nodes that do not change depth.
 *
 * Not a spec-compliant XML formatter — tuned for the brand SVGs we ship.
 */
export function formatSvg(source: string): string {
  const trimmed = source.trim();
  if (!trimmed) return "";
  const collapsed = trimmed.replace(/>\s+</g, "><");
  let depth = 0;
  const out: string[] = [];
  let i = 0;
  const indent = () => "  ".repeat(Math.max(0, depth));

  while (i < collapsed.length) {
    if (collapsed[i] !== "<") {
      const next = collapsed.indexOf("<", i);
      const end = next === -1 ? collapsed.length : next;
      const text = collapsed.slice(i, end).trim();
      if (text) out.push(indent() + text);
      i = end;
      continue;
    }

    if (collapsed.startsWith("<!--", i)) {
      const end = collapsed.indexOf("-->", i);
      if (end === -1) break;
      out.push(indent() + collapsed.slice(i, end + 3));
      i = end + 3;
      continue;
    }
    if (collapsed.startsWith("<![CDATA[", i)) {
      const end = collapsed.indexOf("]]>", i);
      if (end === -1) break;
      out.push(indent() + collapsed.slice(i, end + 3));
      i = end + 3;
      continue;
    }
    if (collapsed[i + 1] === "?" || collapsed[i + 1] === "!") {
      const end = collapsed.indexOf(">", i);
      if (end === -1) break;
      out.push(indent() + collapsed.slice(i, end + 1));
      i = end + 1;
      continue;
    }

    const end = collapsed.indexOf(">", i);
    if (end === -1) break;
    const tag = collapsed.slice(i, end + 1);
    const isClose = tag.startsWith("</");
    const isSelfClose = tag.endsWith("/>");

    if (isClose) depth = Math.max(0, depth - 1);
    out.push(indent() + tag);
    if (!isClose && !isSelfClose) depth += 1;

    i = end + 1;
  }

  return out.join("\n");
}

/** Minify by stripping whitespace between tags and trimming attribute runs. */
export function minifySvg(source: string): string {
  return source
    .trim()
    .replace(/>\s+</g, "><")
    .replace(/\s{2,}/g, " ")
    .replace(/\s*=\s*/g, "=");
}

/**
 * Strip the SVG payload of anything that could execute JavaScript before
 * it is handed to dangerouslySetInnerHTML. We're not running a full
 * sanitizer (no DOMPurify dep), but we remove the high-impact vectors:
 *
 *  - <script> blocks (including any sneaky <script ... > variants)
 *  - inline event handlers (onload, onclick, onerror, on*)
 *  - javascript:, vbscript:, data:text/html URIs in href/xlink:href
 *  - <foreignObject> which can host arbitrary HTML
 *
 * This keeps the viewer safe against self-XSS today and unsafe-share
 * scenarios if a "copy viewer link" feature ever ships.
 */
export function sanitizeSvgForRender(source: string): string {
  if (typeof window === "undefined") return source;
  if (!isLikelySvg(source)) return source;

  const stripped = source
    .replace(/<script[\s\S]*?<\/script\s*>/gi, "")
    .replace(/<script\b[^>]*\/?>/gi, "")
    .replace(/<foreignObject[\s\S]*?<\/foreignObject\s*>/gi, "")
    .replace(/\son[a-z]+\s*=\s*"[^"]*"/gi, "")
    .replace(/\son[a-z]+\s*=\s*'[^']*'/gi, "")
    .replace(/\son[a-z]+\s*=\s*[^\s>]+/gi, "")
    .replace(
      /\s(?:href|xlink:href)\s*=\s*"\s*(?:javascript|vbscript|data:text\/html)[^"]*"/gi,
      "",
    )
    .replace(
      /\s(?:href|xlink:href)\s*=\s*'\s*(?:javascript|vbscript|data:text\/html)[^']*'/gi,
      "",
    );

  return stripped;
}

// ─── Deep links ─────────────────────────────────────────────────────────────
//
// Native desktop apps (Photoshop, Illustrator, Sketch, Figma desktop) do not
// accept arbitrary SVG content via URL schemes — their schemes only resolve
// local file paths or platform-hosted files. For those, the right UX is
// "copy to clipboard" (paste works in Figma/Sketch) or "download then open".
//
// Web targets below DO accept content via URL params or form POST.

export interface DeepLinkTarget {
  id: string;
  label: string;
  hint: string;
  /** "form" → POST form submit (CodePen, JSFiddle). "url" → window.open. "copy" → clipboard write. */
  kind: "form" | "url" | "copy" | "download";
}

export const DEEP_LINK_TARGETS: DeepLinkTarget[] = [
  {
    id: "codepen",
    label: "CodePen",
    hint: "Open in a new pen, HTML pre-filled",
    kind: "form",
  },
  {
    id: "jsfiddle",
    label: "JSFiddle",
    hint: "Open in a new fiddle, HTML pre-filled",
    kind: "form",
  },
  {
    id: "filagram",
    label: "Filagram",
    hint: "Edit, optimize, or convert in the partner viewer",
    kind: "url",
  },
  {
    id: "figma",
    label: "Copy for Figma",
    hint: "Copy to clipboard, then paste into a Figma canvas",
    kind: "copy",
  },
  {
    id: "sketch",
    label: "Copy for Sketch",
    hint: "Copy to clipboard, then paste into a Sketch artboard",
    kind: "copy",
  },
  {
    id: "illustrator",
    label: "Download for Illustrator",
    hint: "Download .svg, then File → Open in Illustrator or Photoshop",
    kind: "download",
  },
];

function submitForm(action: string, fields: Record<string, string>): void {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = action;
  form.target = "_blank";
  form.rel = "noopener";
  form.style.display = "none";
  for (const [name, value] of Object.entries(fields)) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.appendChild(input);
  }
  document.body.appendChild(form);
  form.submit();
  form.remove();
}

function buildPenHtml(svg: string, title: string): string {
  return `<!-- ${title} (via thesvg.org) -->\n<div class="wrap">\n  ${svg}\n</div>\n<style>\n  body { display: grid; place-items: center; min-height: 100vh; margin: 0; background: #0b0d10; }\n  .wrap { padding: 2rem; }\n  .wrap svg { width: 256px; height: 256px; }\n</style>`;
}

export interface DeepLinkOptions {
  /** Public CDN/site URL pointing to the SVG file. When provided, partners
   *  like Filagram receive it as a ?src= query param so they can pre-load
   *  the icon without us having to encode the full XML in the URL. */
  srcUrl?: string;
}

export async function openDeepLink(
  target: DeepLinkTarget,
  svg: string,
  title: string,
  options?: DeepLinkOptions,
): Promise<{ ok: boolean; message?: string }> {
  if (!svg) return { ok: false, message: "Nothing to open." };
  const safeTitle = title || "thesvg export";
  const srcUrl = options?.srcUrl;

  try {
    switch (target.id) {
      case "codepen": {
        submitForm("https://codepen.io/pen/define", {
          data: JSON.stringify({
            title: `${safeTitle} (thesvg.org)`,
            html: buildPenHtml(svg, safeTitle),
            css: "",
            js: "",
            editors: "100",
          }),
        });
        return { ok: true };
      }
      case "jsfiddle": {
        submitForm("https://jsfiddle.net/api/post/library/pure/", {
          title: `${safeTitle} (thesvg.org)`,
          html: buildPenHtml(svg, safeTitle),
          css: "",
          js: "",
        });
        return { ok: true };
      }
      case "filagram": {
        const url = srcUrl
          ? `https://www.filagram.com/svg-viewer?src=${encodeURIComponent(srcUrl)}&title=${encodeURIComponent(safeTitle)}`
          : "https://www.filagram.com/svg-viewer";
        window.open(url, "_blank", "noopener");
        return {
          ok: true,
          message: srcUrl
            ? "Filagram opened with this icon pre-linked."
            : "Filagram opened. Paste the SVG to start editing.",
        };
      }
      case "figma":
      case "sketch": {
        await navigator.clipboard.writeText(svg);
        return {
          ok: true,
          message:
            target.id === "figma"
              ? "Copied. Open Figma and paste (⌘V) onto any frame."
              : "Copied. Open Sketch and paste (⌘V) onto any artboard.",
        };
      }
      case "illustrator": {
        const blob = new Blob([svg], { type: "image/svg+xml" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${safeTitle.replace(/[^a-z0-9-]+/gi, "-").toLowerCase()}.svg`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        return {
          ok: true,
          message: "Downloaded. Open in Illustrator or Photoshop via File → Open.",
        };
      }
      default:
        return { ok: false, message: `Unknown target: ${target.id}` };
    }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not open the deep link.";
    return { ok: false, message };
  }
}
