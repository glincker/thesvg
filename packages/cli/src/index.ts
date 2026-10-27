#!/usr/bin/env node

import { runAdd } from "./commands/add.js";
import { runList } from "./commands/list.js";
import { runSearch } from "./commands/search.js";
import { colorize, dim, header } from "./utils/colors.js";

const VERSION = "0.1.0";

function printHelp(): void {
  console.log(`
${header("thesvg")} ${dim(`v${VERSION}`)} — Add SVG icons to your project

${colorize("bold", "USAGE")}

  thesvg <command> [options]

${colorize("bold", "COMMANDS")}

  ${colorize("cyan", "add")} <slug> [slug...]    Add one or more icons to your project (ui:<slug> for UI icons)
  ${colorize("cyan", "list")} [options]          List available icons (with optional category filter)
  ${colorize("cyan", "search")} <query>          Search icons by name or keyword

${colorize("bold", "EXAMPLES")}

  ${dim("# Add a single icon (outputs SVG by default)")}
  thesvg add github

  ${dim("# Add multiple icons")}
  thesvg add github vercel nextjs

  ${dim("# Add as JSX React component")}
  thesvg add github --format jsx

  ${dim("# Add as Vue SFC")}
  thesvg add github --format vue

  ${dim("# Custom output directory")}
  thesvg add github --dir ./src/assets/icons

  ${dim("# Add a specific variant")}
  thesvg add github --variant dark

  ${dim("# Add a UI icon in a specific look")}
  thesvg add ui:arrow-down --look glass

  ${dim("# List UI icons, optionally by category")}
  thesvg list --ui --category Arrows

  ${dim("# Search UI icons")}
  thesvg search arrow --ui

  ${dim("# List all icons")}
  thesvg list

  ${dim("# List icons in a category")}
  thesvg list --category AI

  ${dim("# Search icons")}
  thesvg search "version control"

${colorize("bold", "ADD OPTIONS")}

  --variant, -v <name>    Icon variant: default, light, dark, mono, wordmark (default: default)
  --dir,     -d <path>    Output directory (default: ./public/icons or ./src/icons)
  --format,  -f <fmt>     Output format: svg, jsx, vue (default: svg)
  --look <name>           UI icons only (ui:<slug>): outline, glass, duotone, offset, fill, glass-outline, depth (default: outline)

${colorize("bold", "LIST OPTIONS")}

  --category, -c <name>   Filter by category name
  --limit,    -l <n>      Max results to show (default: 50)
  --ui                    List UI icons instead of brand icons

${colorize("bold", "SEARCH OPTIONS")}

  --limit, -l <n>         Max results to show (default: 20)
  --ui                    Search UI icons instead of brand icons

${colorize("bold", "FLAGS")}

  --help, -h              Show this help message
  --version, -V           Print version

${dim("More info: https://thesvg.org")}
`);
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);

  if (argv.length === 0 || argv[0] === "--help" || argv[0] === "-h") {
    printHelp();
    process.exit(0);
  }

  if (argv[0] === "--version" || argv[0] === "-V") {
    console.log(VERSION);
    process.exit(0);
  }

  const command = argv[0];
  const rest = argv.slice(1);

  switch (command) {
    case "add":
      await runAdd(rest);
      break;

    case "list":
      await runList(rest);
      break;

    case "search":
      await runSearch(rest);
      break;

    default:
      console.error(
        `${colorize("red", "Unknown command:")} ${command}\n`
      );
      printHelp();
      process.exit(1);
  }
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`${colorize("red", "Fatal error:")} ${message}`);
  process.exit(1);
});
