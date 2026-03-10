import * as esbuild from "esbuild";
import fs from "fs";
import path from "path";

const isWatch = process.argv.includes("--watch");

// Build the main plugin code (sandbox)
const mainConfig = {
  entryPoints: ["src/main.ts"],
  bundle: true,
  outfile: "build/main.js",
  target: "es2017",
  format: "iife",
};

// Build the UI code and inline it into HTML
const uiConfig = {
  entryPoints: ["src/ui.ts"],
  bundle: true,
  outfile: "build/ui.js",
  target: "es2020",
  format: "iife",
  write: false,
};

async function build() {
  // Build main
  await esbuild.build(mainConfig);

  // Build UI JS
  const uiResult = await esbuild.build(uiConfig);
  const uiJs = uiResult.outputFiles[0].text;

  // Read HTML template
  const htmlTemplate = fs.readFileSync(
    path.resolve("src/ui.html"),
    "utf-8"
  );

  // Inline the JS into the HTML
  const finalHtml = htmlTemplate.replace(
    "<!-- SCRIPT_PLACEHOLDER -->",
    `<script>${uiJs}</script>`
  );

  fs.mkdirSync("build", { recursive: true });
  fs.writeFileSync("build/ui.html", finalHtml);

  console.log("Build complete");
}

if (isWatch) {
  // Watch mode: rebuild on changes
  const ctx1 = await esbuild.context(mainConfig);
  const ctx2 = await esbuild.context({ ...uiConfig, write: true });
  await ctx1.watch();
  await ctx2.watch();
  console.log("Watching for changes...");

  // Also do initial HTML inline build
  await build();
} else {
  await build();
}
