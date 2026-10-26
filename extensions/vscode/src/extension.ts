import * as vscode from "vscode";

const BASE_URL = "https://thesvg.org";
const REGISTRY_URL = `${BASE_URL}/api/registry.json`;
// Single jsDelivr root for every CDN path (brand icons, UI icons, UI index).
const CDN = "https://cdn.jsdelivr.net/gh/glincker/thesvg@main";
const JSDELIVR_BASE = `${CDN}/public/icons`;
const UI_INDEX_URL = `${CDN}/src/data/ui-icons.json`;
const UI_DEFAULT_LOOK = "outline";

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

interface UiIconEntry {
  slug: string;
  title: string;
  category: string;
  tags: string[];
  set: string;
  releasedOn: string;
}

interface UiIndex {
  version: number;
  kind: string;
  looks: string[];
  icons: UiIconEntry[];
}

type PickedIcon =
  | { kind: "brand"; icon: IconEntry }
  | { kind: "ui"; icon: UiIconEntry; looks: string[] };

// Normalised shape the action flow works on, so brand and UI share one path.
interface Target {
  slug: string;
  title: string;
  variants: string[];
  defaultVariant: string;
  variantNoun: string;
  svgUrl: (variant: string) => string;
  cdnUrl: (variant: string) => string;
  webUrl: string | null;
  cliCommand: string | null;
}

const FETCH_TIMEOUT_MS = 15_000;

let iconsCache: IconEntry[] | null = null;
let uiCache: UiIndex | null = null;

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

// Lazy and fail-soft: any failure or malformed payload yields null, never a throw.
async function fetchUiIndex(token?: vscode.CancellationToken): Promise<UiIndex | null> {
  if (uiCache) return uiCache;
  try {
    const response = await fetchWithTimeout(UI_INDEX_URL, token);
    if (!response.ok) return null;
    const data = (await response.json()) as Partial<UiIndex>;
    if (!Array.isArray(data.icons) || !Array.isArray(data.looks) || data.looks.length === 0) {
      return null;
    }
    uiCache = {
      version: data.version ?? 1,
      kind: data.kind ?? "ui",
      looks: data.looks,
      icons: data.icons,
    };
    return uiCache;
  } catch {
    return null;
  }
}

// The per-icon files are served by the site, not committed to the repo.
function getUiSvgUrl(slug: string, look: string): string {
  return `${BASE_URL}/ui/${slug}/${look}.svg`;
}

function brandTarget(icon: IconEntry): Target {
  return {
    slug: icon.slug,
    title: icon.title,
    variants: icon.variants,
    defaultVariant: "default",
    variantNoun: "Variant",
    svgUrl: (v) => getIconUrl(icon.slug, v),
    cdnUrl: (v) => getCdnUrl(icon.slug, v),
    webUrl: `${BASE_URL}/icon/${icon.slug}`,
    cliCommand: `npx @thesvg/cli add ${icon.slug}`,
  };
}

function uiTarget(icon: UiIconEntry, looks: string[]): Target {
  return {
    slug: icon.slug,
    title: icon.title,
    variants: looks,
    defaultVariant: looks.includes(UI_DEFAULT_LOOK) ? UI_DEFAULT_LOOK : looks[0],
    variantNoun: "Look",
    svgUrl: (v) => getUiSvgUrl(icon.slug, v),
    cdnUrl: (v) => getUiSvgUrl(icon.slug, v),
    webUrl: null,
    cliCommand: null,
  };
}

function getIconUrl(slug: string, variant: string = "default"): string {
  return `${BASE_URL}/icons/${slug}/${variant}.svg`;
}

function getCdnUrl(slug: string, variant: string = "default"): string {
  return `${JSDELIVR_BASE}/${slug}/${variant}.svg`;
}

async function fetchSvgContent(target: Target, variant: string): Promise<string> {
  const response = await fetchWithTimeout(target.svgUrl(variant));
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
  pick: PickedIcon;
}

function toQuickPickItem(icon: IconEntry): IconQuickPickItem {
  return {
    label: `$(symbol-color) ${icon.title}`,
    description: icon.categories[0] || "",
    detail: `${icon.slug} | ${icon.variants.join(", ")}`,
    pick: { kind: "brand", icon },
  };
}

function toUiQuickPickItem(icon: UiIconEntry, looks: string[]): IconQuickPickItem {
  return {
    label: `$(symbol-misc) ${icon.title}`,
    description: icon.category,
    detail: `${icon.slug} | ${icon.tags.join(", ")}`,
    pick: { kind: "ui", icon, looks },
  };
}

function matchesUi(icon: UiIconEntry, query: string): boolean {
  return (
    icon.title.toLowerCase().includes(query) ||
    icon.slug.toLowerCase().includes(query) ||
    icon.category.toLowerCase().includes(query) ||
    icon.tags.some((t) => t.toLowerCase().includes(query))
  );
}

async function showIconPicker(): Promise<PickedIcon | undefined> {
  const icons = await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: "theSVG: Loading icons...",
      cancellable: true,
    },
    (_progress, token) => fetchIcons(token)
  );

  const quickPick = vscode.window.createQuickPick<IconQuickPickItem>();
  quickPick.matchOnDescription = true;
  quickPick.matchOnDetail = true;

  const popular = ["github", "react", "aws-aws-lambda", "azure-functions", "docker", "typescript", "vercel", "stripe"];
  const popularItems: IconQuickPickItem[] = popular
    .map((slug) => icons.find((i) => i.slug === slug))
    .filter((i): i is IconEntry => i !== undefined)
    .map(toQuickPickItem);

  let mode: "brand" | "ui" = "brand";
  let ui: UiIndex | null = null;

  const toUiButton: vscode.QuickInputButton = {
    iconPath: new vscode.ThemeIcon("symbol-misc"),
    tooltip: "Switch to UI icons",
  };
  const toBrandButton: vscode.QuickInputButton = {
    iconPath: new vscode.ThemeIcon("symbol-color"),
    tooltip: "Switch to brand icons",
  };

  const refresh = (): void => {
    const value = quickPick.value.trim().toLowerCase();
    if (mode === "brand") {
      quickPick.title = "theSVG: Brand icons";
      quickPick.placeholder = `Search ${icons.length.toLocaleString()} icons (e.g. lambda, stripe, compute)`;
      quickPick.buttons = [toUiButton];
      quickPick.items = value
        ? icons
            .filter(
              (i) =>
                i.title.toLowerCase().includes(value) ||
                i.slug.toLowerCase().includes(value) ||
                i.aliases.some((a) => a.toLowerCase().includes(value)) ||
                i.categories.some((c) => c.toLowerCase().includes(value))
            )
            .slice(0, 50)
            .map(toQuickPickItem)
        : popularItems;
      return;
    }
    const index = ui;
    if (!index) return;
    quickPick.title = "theSVG: UI icons";
    quickPick.placeholder = `Search ${index.icons.length.toLocaleString()} UI icons (title, tag or category)`;
    quickPick.buttons = [toBrandButton];
    quickPick.items = index.icons
      .filter((i) => !value || matchesUi(i, value))
      .slice(0, 50)
      .map((i) => toUiQuickPickItem(i, index.looks));
  };

  quickPick.onDidChangeValue(refresh);
  quickPick.onDidTriggerButton(async () => {
    if (mode === "ui") {
      mode = "brand";
      refresh();
      return;
    }
    quickPick.busy = true;
    ui = await fetchUiIndex();
    quickPick.busy = false;
    if (!ui) {
      vscode.window.showInformationMessage("theSVG: UI icons are not available right now. Showing brand icons.");
      return;
    }
    mode = "ui";
    refresh();
  });

  refresh();

  return new Promise((resolve) => {
    quickPick.onDidAccept(() => {
      const selected = quickPick.selectedItems[0];
      quickPick.hide();
      resolve(selected?.pick);
    });
    quickPick.onDidHide(() => {
      quickPick.dispose();
      resolve(undefined);
    });
    quickPick.show();
  });
}

async function showActionPicker(target: Target, variant: string): Promise<string | undefined> {
  const variantLabel = variant === "default" ? "" : ` (${variant})`;
  const actions = [
    { label: "$(copy) Copy SVG", description: `Copy ${target.title}${variantLabel} SVG`, action: "copy-svg" },
    { label: "$(code) Copy as JSX", description: "Copy as React component", action: "copy-jsx" },
    { label: "$(link) Copy CDN Link", description: "jsDelivr CDN URL", action: "copy-cdn" },
    { label: "$(insert) Insert SVG at Cursor", description: "Insert into active editor", action: "insert-svg" },
  ];
  if (target.cliCommand) {
    actions.push({ label: "$(terminal) Copy CLI Command", description: target.cliCommand, action: "copy-cli" });
  }
  if (target.webUrl) {
    actions.push({ label: "$(globe) Open on thesvg.org", description: target.webUrl.replace("https://", ""), action: "open-web" });
  }

  if (target.variants.length > 1) {
    actions.splice(1, 0, {
      label: `$(list-selection) Choose ${target.variantNoun} (${target.variants.join(", ")})`,
      description: `Pick a specific ${target.variantNoun.toLowerCase()}`,
      action: "choose-variant",
    });
  }

  const selected = await vscode.window.showQuickPick(actions, {
    placeHolder: `${target.title}${variantLabel} - What do you want to do?`,
  });

  return selected?.action;
}

async function chooseVariant(target: Target, current: string): Promise<string> {
  if (target.variants.length <= 1) return current;

  const selected = await vscode.window.showQuickPick(
    target.variants.map((v) => ({
      label: v === target.defaultVariant ? `$(star) ${v}` : `$(circle-outline) ${v}`,
      description: target.svgUrl(v),
      variant: v,
    })),
    { placeHolder: `Choose ${target.variantNoun.toLowerCase()}` }
  );

  return selected?.variant || current;
}

async function runFlow(directAction?: string): Promise<void> {
  try {
    const picked = await showIconPicker();
    if (!picked) return;
    const target = picked.kind === "brand" ? brandTarget(picked.icon) : uiTarget(picked.icon, picked.looks);

    if (directAction) {
      await executeAction(directAction, target, target.defaultVariant);
      return;
    }

    let variant = target.defaultVariant;
    let action = await showActionPicker(target, variant);
    if (!action) return;

    if (action === "choose-variant") {
      variant = await chooseVariant(target, variant);
      action = await showActionPicker(target, variant);
      if (!action || action === "choose-variant") return;
    }

    await executeAction(action, target, variant);
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

async function executeAction(action: string, target: Target, variant: string): Promise<void> {
  switch (action) {
    case "copy-svg": {
      const svg = await fetchSvgContent(target, variant);
      await vscode.env.clipboard.writeText(svg);
      vscode.window.showInformationMessage(`Copied ${target.title} SVG to clipboard`);
      break;
    }
    case "copy-jsx": {
      const svg = await fetchSvgContent(target, variant);
      const jsx = svgToJsx(svg, target.title);
      await vscode.env.clipboard.writeText(jsx);
      vscode.window.showInformationMessage(`Copied ${target.title} JSX component to clipboard`);
      break;
    }
    case "copy-cdn": {
      await vscode.env.clipboard.writeText(target.cdnUrl(variant));
      vscode.window.showInformationMessage(`Copied ${target.title} CDN link to clipboard`);
      break;
    }
    case "copy-cli": {
      await vscode.env.clipboard.writeText(target.cliCommand ?? "");
      vscode.window.showInformationMessage(`Copied CLI command to clipboard`);
      break;
    }
    case "insert-svg": {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showWarningMessage("No active editor to insert into");
        return;
      }
      const svg = await fetchSvgContent(target, variant);
      await editor.edit((editBuilder) => {
        editBuilder.insert(editor.selection.active, svg);
      });
      vscode.window.showInformationMessage(`Inserted ${target.title} SVG`);
      break;
    }
    case "open-web": {
      if (target.webUrl) vscode.env.openExternal(vscode.Uri.parse(target.webUrl));
      break;
    }
  }
}

export function deactivate() {
  iconsCache = null;
  uiCache = null;
}
