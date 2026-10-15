#!/usr/bin/env node
/**
 * Screenshots a page of the running site in light and dark, ready for
 * scripts/optimize-og.mjs. Uses headless Chrome over the DevTools protocol,
 * so there is nothing to install beyond Chrome itself and Node 22+.
 *
 *   pnpm dev                                  # in another terminal
 *   node scripts/capture-og.mjs [path] [outDir]
 *
 * Defaults: path "/", outDir "/tmp/og-shots". Writes raw-dark.png and
 * raw-light.png. The page is rendered at a 1600x840 viewport (the same
 * aspect ratio as the 1200x630 OG card) at 2x pixel density, so the
 * optimizer's downscale gives a zoomed-out, crisp result: more of the UI
 * fits in frame and text stays sharp. Override with BASE_URL and CHROME_PATH.
 */
import { spawn } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3333";
const CHROME =
  process.env.CHROME_PATH ??
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const [pagePath = "/", outDir = "/tmp/og-shots"] = process.argv.slice(2);
const THEME_KEY = "thesvg-theme";
// Pre-dismiss every toast and hint so none of them lands in the frame.
const SEEN = {
  "thesvg-hint-dismissed": "1",
  "thesvg-last-seen-post-date": "2999-01-01",
  "thesvg-star-prompt-done": "1",
};
const WIDTH = 1600;
const HEIGHT = 840;
const SCALE = 2;

mkdirSync(outDir, { recursive: true });
const port = 9300 + Math.floor(Math.random() * 500);
const profile = mkdtempSync(join(tmpdir(), "thesvg-og-"));

const chrome = spawn(
  CHROME,
  [
    "--headless=new",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    "--no-first-run",
    "--disable-gpu",
    "--hide-scrollbars",
    `--window-size=${WIDTH},${HEIGHT}`,
    "about:blank",
  ],
  { stdio: "ignore" },
);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function wsUrl() {
  for (let i = 0; i < 50; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/list`);
      const pages = await res.json();
      const page = pages.find((p) => p.type === "page");
      if (page) return page.webSocketDebuggerUrl;
    } catch {
      // Chrome is still starting
    }
    await sleep(200);
  }
  throw new Error("Chrome did not expose a DevTools endpoint");
}

function connect(url) {
  const ws = new WebSocket(url);
  let id = 0;
  const pending = new Map();
  ws.onmessage = (e) => {
    const msg = JSON.parse(e.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
    }
  };
  const ready = new Promise((r) => (ws.onopen = r));
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const n = ++id;
      pending.set(n, { resolve, reject });
      ws.send(JSON.stringify({ id: n, method, params }));
    });
  return { ready, send, close: () => ws.close() };
}

try {
  const client = connect(await wsUrl());
  await client.ready;
  await client.send("Page.enable");
  await client.send("Emulation.setDeviceMetricsOverride", {
    width: WIDTH,
    height: HEIGHT,
    deviceScaleFactor: SCALE,
    mobile: false,
  });

  for (const theme of ["dark", "light"]) {
    // Land on the origin first so localStorage is writable, then reload.
    await client.send("Page.navigate", { url: `${BASE_URL}${pagePath}` });
    await sleep(2500);
    await client.send("Runtime.evaluate", {
      expression: `localStorage.setItem(${JSON.stringify(THEME_KEY)}, ${JSON.stringify(theme)});
        Object.entries(${JSON.stringify(SEEN)}).forEach(([k, v]) => localStorage.setItem(k, v));
        sessionStorage.clear(); true`,
    });
    await client.send("Page.reload");
    await sleep(5000); // hydration, fonts and entrance animations
    const shot = await client.send("Page.captureScreenshot", { format: "png" });
    const file = join(outDir, `raw-${theme}.png`);
    writeFileSync(file, Buffer.from(shot.data, "base64"));
    console.log(`captured ${theme}: ${file}`);
  }
  client.close();
} finally {
  chrome.kill();
}
