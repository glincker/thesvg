import * as vscode from "vscode";

const BASE_URL = "https://thesvg.org";
const REGISTRY_URL = `${BASE_URL}/api/registry.json`;
const JSDELIVR_BASE = "https://cdn.jsdelivr.net/gh/glincker/thesvg@main/public/icons";

interface IconEntry {
  slug: string;
  title: string;
  aliases: string[];
  hex: string;
  categories: string[];
  variants: string[];
  url: string | null;
}

interface RegistryResponse {
  total: number;
  icons: IconEntry[];
}

const FETCH_TIMEOUT_MS = 15_000;

let iconsCache: IconEntry[] | null = null;

async function fetchWithTimeout(
  url: string,
  token?: vscode.CancellationToken,
  ms: number = FETCH_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);
  const cancelSub = token?.onCancellationRequested(() => controller.abort());
  try {
    return await fetch(url, { signal: controller.signal });
  } catch (err) {
    if (token?.isCancellationRequested) {
      throw new Error("Cancelled");
    }
    if (controller.signal.aborted) {
      throw new Error(`Request timed out after ${ms / 1000}s: ${url}`);
    }
    throw err;
  } finally {
    clearTimeout(timeout);
    cancelSub?.dispose();
  }
}

async function fetchIcons(token?: vscode.CancellationToken): Promise<IconEntry[]> {
  if (iconsCache) return iconsCache;

  const response = await fetchWithTimeout(REGISTRY_URL, token);
  if (!response.ok) {
    throw new Error(`Failed to fetch icons: ${response.status}`);
  }
  const data = (await response.json()) as RegistryResponse;
  iconsCache = data.icons;
  return iconsCache;
}

function getIconUrl(slug: string, variant: string = "default"): string {
  return `${BASE_URL}/icons/${slug}/${variant}.svg`;
}

function getCdnUrl(slug: string, variant: string = "default"): string {
  return `${JSDELIVR_BASE}/${slug}/${variant}.svg`;
}

async function fetchSvgContent(slug: string, variant: string = "default"): Promise<string> {
  const response = await fetchWithTimeout(getIconUrl(slug, variant));
  if (!response.ok) {
    throw new Error(`Failed to fetch SVG: ${response.status}`);
  }
  return response.text();
}

function kebabOrNsToCamel(name: string): string {
  return name.replace(/[-:]([a-z])/g, (_, c: string) => c.toUpperCase());
}

function convertInlineStyle(styleBody: string): string {
  const props = styleBody
    .split(";")
    .map((rule) => rule.trim())
    .filter(Boolean)
    .map((rule) => {
      const idx = rule.indexOf(":");
      if (idx === -1) return null;
      const key = kebabOrNsToCamel(rule.slice(0, idx).trim());
      const value = rule.slice(idx + 1).trim().replace(/"/g, '\\"');
      return `${key}: "${value}"`;
    })
    .filter((p): p is string => p !== null)
    .join(", ");
  return ` style={{${props}}}`;
}

function svgToJsx(svg: string, title: string): string {
  const componentName = title.replace(/[^a-zA-Z0-9]/g, "") + "Icon";

  const jsxBody = svg
    // Camel-case hyphenated or namespaced attribute names (stroke-width, xlink:href, etc.)
    .replace(/(\s)([a-z]+(?:[-:][a-z]+)+)(\s*=)/g, (_m, ws: string, name: string, eq: string) =>
      `${ws}${kebabOrNsToCamel(name)}${eq}`
    )
    // React-reserved single-word attributes
    .replace(/(\s)class=/g, "$1className=")
    .replace(/(\s)for=/g, "$1htmlFor=")
    .replace(/(\s)tabindex=/g, "$1tabIndex=")
    // Inline style="..." -> style={{...}}
    .replace(/\sstyle="([^"]*)"/g, (_m, body: string) => convertInlineStyle(body));

  return `function ${componentName}(props) {\n  return (\n    ${jsxBody}\n  );\n}`;
}

interface IconQuickPickItem extends vscode.QuickPickItem {
  icon: IconEntry;
}

function toQuickPickItem(icon: IconEntry): IconQuickPickItem {
  return {
    label: `$(symbol-color) ${icon.title}`,
    description: icon.categories[0] || "",
    detail: `${icon.slug} | ${icon.variants.join(", ")}`,
    icon,
  };
}

async function showIconPicker(): Promise<IconEntry | undefined> {
  const icons = await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: "theSVG: Loading icons...",
      cancellable: true,
    },
    (_progress, token) => fetchIcons(token)
  );

  const quickPick = vscode.window.createQuickPick<IconQuickPickItem>();
  quickPick.placeholder = `Search ${icons.length.toLocaleString()} icons (e.g. lambda, stripe, compute)`;
  quickPick.matchOnDescription = true;
  quickPick.matchOnDetail = true;

  const popular = ["github", "react", "aws-aws-lambda", "azure-functions", "docker", "typescript", "vercel", "stripe"];
  const popularItems: IconQuickPickItem[] = popular
    .map((slug) => icons.find((i) => i.slug === slug))
    .filter((i): i is IconEntry => i !== undefined)
    .map(toQuickPickItem);

  quickPick.items = popularItems;

  quickPick.onDidChangeValue((value) => {
    if (!value.trim()) {
      quickPick.items = popularItems;
      return;
    }

    const query = value.toLowerCase();
    const filtered = icons
      .filter(
        (i) =>
          i.title.toLowerCase().includes(query) ||
          i.slug.toLowerCase().includes(query) ||
          i.aliases.some((a) => a.toLowerCase().includes(query)) ||
          i.categories.some((c) => c.toLowerCase().includes(query))
      )
      .slice(0, 50)
      .map(toQuickPickItem);

    quickPick.items = filtered;
  });

  return new Promise((resolve) => {
    quickPick.onDidAccept(() => {
      const selected = quickPick.selectedItems[0];
      quickPick.hide();
      resolve(selected?.icon);
    });
    quickPick.onDidHide(() => {
      quickPick.dispose();
      resolve(undefined);
    });
    quickPick.show();
  });
}

async function showActionPicker(icon: IconEntry, variant: string): Promise<string | undefined> {
  const variantLabel = variant === "default" ? "" : ` (${variant})`;
  const actions = [
    { label: "$(copy) Copy SVG", description: `Copy ${icon.title}${variantLabel} SVG`, action: "copy-svg" },
    { label: "$(code) Copy as JSX", description: "Copy as React component", action: "copy-jsx" },
    { label: "$(link) Copy CDN Link", description: "jsDelivr CDN URL", action: "copy-cdn" },
    { label: "$(insert) Insert SVG at Cursor", description: "Insert into active editor", action: "insert-svg" },
    { label: "$(terminal) Copy CLI Command", description: `npx @thesvg/cli add ${icon.slug}`, action: "copy-cli" },
    { label: "$(globe) Open on thesvg.org", description: `thesvg.org/icon/${icon.slug}`, action: "open-web" },
  ];

  if (icon.variants.length > 1) {
    actions.splice(1, 0, {
      label: `$(list-selection) Choose Variant (${icon.variants.join(", ")})`,
      description: "Pick a specific variant",
      action: "choose-variant",
    });
  }

  const selected = await vscode.window.showQuickPick(actions, {
    placeHolder: `${icon.title}${variantLabel} - What do you want to do?`,
  });

  return selected?.action;
}

async function chooseVariant(icon: IconEntry): Promise<string> {
  if (icon.variants.length <= 1) return "default";

  const selected = await vscode.window.showQuickPick(
    icon.variants.map((v) => ({
      label: v === "default" ? "$(star) default" : `$(circle-outline) ${v}`,
      description: getIconUrl(icon.slug, v),
      variant: v,
    })),
    { placeHolder: "Choose variant" }
  );

  return selected?.variant || "default";
}

async function runFlow(directAction?: string): Promise<void> {
  try {
    const icon = await showIconPicker();
    if (!icon) return;

    if (directAction) {
      await executeAction(directAction, icon, "default");
      return;
    }

    let variant = "default";
    let action = await showActionPicker(icon, variant);
    if (!action) return;

    if (action === "choose-variant") {
      variant = await chooseVariant(icon);
      action = await showActionPicker(icon, variant);
      if (!action || action === "choose-variant") return;
    }

    await executeAction(action, icon, variant);
  } catch (err) {
    vscode.window.showErrorMessage(`theSVG: ${err instanceof Error ? err.message : "Unknown error"}`);
  }
}

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand("thesvg.search", () => runFlow()),
    vscode.commands.registerCommand("thesvg.copySvg", () => runFlow("copy-svg")),
    vscode.commands.registerCommand("thesvg.copyJsx", () => runFlow("copy-jsx")),
    vscode.commands.registerCommand("thesvg.copyCdn", () => runFlow("copy-cdn")),
    vscode.commands.registerCommand("thesvg.insertSvg", () => runFlow("insert-svg"))
  );
}

async function executeAction(action: string, icon: IconEntry, variant: string): Promise<void> {
  switch (action) {
    case "copy-svg": {
      const svg = await fetchSvgContent(icon.slug, variant);
      await vscode.env.clipboard.writeText(svg);
      vscode.window.showInformationMessage(`Copied ${icon.title} SVG to clipboard`);
      break;
    }
    case "copy-jsx": {
      const svg = await fetchSvgContent(icon.slug, variant);
      const jsx = svgToJsx(svg, icon.title);
      await vscode.env.clipboard.writeText(jsx);
      vscode.window.showInformationMessage(`Copied ${icon.title} JSX component to clipboard`);
      break;
    }
    case "copy-cdn": {
      await vscode.env.clipboard.writeText(getCdnUrl(icon.slug, variant));
      vscode.window.showInformationMessage(`Copied ${icon.title} CDN link to clipboard`);
      break;
    }
    case "copy-cli": {
      await vscode.env.clipboard.writeText(`npx @thesvg/cli add ${icon.slug}`);
      vscode.window.showInformationMessage(`Copied CLI command to clipboard`);
      break;
    }
    case "insert-svg": {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showWarningMessage("No active editor to insert into");
        return;
      }
      const svg = await fetchSvgContent(icon.slug, variant);
      await editor.edit((editBuilder) => {
        editBuilder.insert(editor.selection.active, svg);
      });
      vscode.window.showInformationMessage(`Inserted ${icon.title} SVG`);
      break;
    }
    case "open-web": {
      vscode.env.openExternal(vscode.Uri.parse(`${BASE_URL}/icon/${icon.slug}`));
      break;
    }
  }
}

export function deactivate() {
  iconsCache = null;
}
