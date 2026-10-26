// Preloaded into the spawned server (node --import) so tests never hit the
// network. THESVG_TEST_UI=down makes only the UI index request fail.
import { readFileSync } from "node:fs";

const fixture = readFileSync(
  new URL("./fixtures/ui-icons.json", import.meta.url),
  "utf-8"
);

globalThis.fetch = async (input) => {
  const url = String(input);
  if (url.endsWith("/src/data/ui-icons.json")) {
    if (process.env.THESVG_TEST_UI === "down") throw new Error("ECONNREFUSED");
    return new Response(fixture, { status: 200 });
  }
  const ui = /thesvg\.org\/ui\/([^/]+)\/([^/]+)\.svg$/.exec(url);
  if (ui) return new Response(`<svg data-ui="${ui[1]}" data-look="${ui[2]}"/>`);
  if (/\/public\/icons\//.test(url)) return new Response("<svg data-brand/>");
  return new Response("", { status: 404 });
};
