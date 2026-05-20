import { defineConfig } from "wxt";

export default defineConfig({
  extensionApi: "chrome",
  modules: ["@wxt-dev/module-react"],
  browser: "chrome",
  manifest: {
    name: "theSVG",
    description: "Search 6,030+ brand SVGs. Copy SVG, CDN URL, or markdown.",
    version: "0.1.0",
    permissions: ["storage", "clipboardWrite"],
    host_permissions: ["https://cdn.jsdelivr.net/*"],
    action: {
      default_popup: "popup/index.html",
      default_title: "theSVG",
      default_icon: {
        "16": "icon/16.png",
        "48": "icon/48.png",
        "128": "icon/128.png",
      },
    },
    icons: {
      "16": "icon/16.png",
      "48": "icon/48.png",
      "128": "icon/128.png",
    },
  },
});
