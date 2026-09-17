// OpenAI Apps SDK widget resource for search_icons.
//
// Verified against openai/openai-apps-sdk-examples (pizzaz_server_node,
// src/server.ts) on 2026-09-14: a widget is an MCP resource whose URI uses
// the `ui://widget/...` scheme and whose mimeType is `text/html+skybridge`.
// The tool that renders it carries `_meta["openai/outputTemplate"]` pointing
// at that resource URI, plus `openai/toolInvocation/invoking` /
// `openai/toolInvocation/invoked` / `openai/widgetAccessible` entries. Actual
// per-call data reaches the widget through the tool result's
// `structuredContent`, which the iframe reads client-side via
// `window.openai.toolOutput` (confirmed via OpenAI Apps SDK docs/community
// write-ups referencing the same field).
//
// Only search_icons gets a widget; the other four tools stay plain text per
// the task spec, so this module is intentionally self-contained rather than
// a generic "widget framework."

export const SEARCH_WIDGET_TEMPLATE_URI = "ui://widget/icon-search-results.html";

export function widgetDescriptorMeta() {
  return {
    "openai/outputTemplate": SEARCH_WIDGET_TEMPLATE_URI,
    "openai/toolInvocation/invoking": "Searching thesvg.org...",
    "openai/toolInvocation/invoked": "Found icons",
    "openai/widgetAccessible": true,
    "openai/widgetPrefersBorder": true,
  } as const;
}

export interface WidgetIcon {
  slug: string;
  name: string;
  url: string;
}

/** Maps search results into the minimal shape the widget's client JS needs. */
export function toWidgetIcons(
  results: { slug: string; name: string; variants: string[] }[],
  buildUrl: (slug: string, variant: string) => string
): WidgetIcon[] {
  return results.map((r) => ({
    slug: r.slug,
    name: r.name,
    url: buildUrl(r.slug, r.variants.includes("default") ? "default" : (r.variants[0] ?? "default")),
  }));
}

/**
 * Static widget shell registered once as a resource. It has no baked-in data;
 * it reads `window.openai.toolOutput.icons` at render time so the same
 * template serves every search_icons call.
 */
export function buildSearchWidgetHtml(): string {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      body {
        margin: 0;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        background: transparent;
        color: #e5e5e5;
      }
      .thesvg-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(72px, 1fr));
        gap: 12px;
        padding: 12px;
      }
      .thesvg-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        text-align: center;
      }
      .thesvg-item img {
        width: 40px;
        height: 40px;
        object-fit: contain;
        border-radius: 8px;
        background: rgba(127, 127, 127, 0.12);
        padding: 8px;
      }
      .thesvg-item span {
        font-size: 11px;
        line-height: 1.2;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        max-width: 100%;
      }
      .thesvg-empty {
        padding: 16px;
        font-size: 13px;
        opacity: 0.7;
      }
    </style>
  </head>
  <body>
    <div id="thesvg-root" class="thesvg-empty">Loading icons...</div>
    <script>
      (function () {
        function render() {
          var root = document.getElementById("thesvg-root");
          var output = (window.openai && window.openai.toolOutput) || {};
          var icons = output.icons || [];
          if (!icons.length) {
            root.className = "thesvg-empty";
            root.textContent = "No icons found.";
            return;
          }
          var grid = document.createElement("div");
          grid.className = "thesvg-grid";
          icons.forEach(function (icon) {
            var item = document.createElement("div");
            item.className = "thesvg-item";
            var img = document.createElement("img");
            img.src = icon.url;
            img.alt = icon.name;
            img.loading = "lazy";
            var label = document.createElement("span");
            label.textContent = icon.name;
            item.appendChild(img);
            item.appendChild(label);
            grid.appendChild(item);
          });
          root.className = "";
          root.replaceChildren(grid);
        }
        render();
        if (window.openai && typeof window.openai.addEventListener === "function") {
          window.openai.addEventListener("toolOutputChange", render);
        }
      })();
    </script>
  </body>
</html>`;
}
