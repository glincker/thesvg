// theSVG Figma Plugin - UI thread (iframe)
// No network requests here; all fetches happen in the sandbox (main.ts).

// Marks the file as a module so top-level names do not clash with DOM globals.
export {};

const CDN_ROOT ="https://cdn.jsdelivr.net/gh/glincker/thesvg@main/public";

interface IconEntry {
  slug: string;
  title: string;
  categories: string[];
  variants: string[];
  variantPaths: Record<string, string>;
}

interface RecentEntry {
  slug: string;
  title: string;
  variant: string;
  at: number;
}

interface UiIconEntry {
  slug: string;
  title: string;
  category: string;
  tags: string[];
}

type Mode = "brand" | "ui";

// ---- State ----
let mode: Mode = "brand";
let brandQuery = "";
let brandCategory = "all";
let uiQuery = "";
let uiCategory = "all";
let uiIcons: UiIconEntry[] = [];
let uiLooks: string[] = [];
let uiLook = "";
let uiColor = "#111111";
const uiSvgs = new Map<string, string>();
let uiFiltered: UiIconEntry[] = [];
let brandCategoryOptions = "";
let currentQuery = "";
let currentCategory = "all";
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let lastResults: IconEntry[] = [];

// ---- DOM refs ----
const searchInput = document.getElementById("search") as HTMLInputElement;
const categorySelect = document.getElementById("category") as HTMLSelectElement;
const grid = document.getElementById("grid") as HTMLDivElement;
const status = document.getElementById("status") as HTMLDivElement;
const loading = document.getElementById("loading") as HTMLDivElement;
const recentsSection = document.getElementById("recents-section") as HTMLDivElement;
const recentsRow = document.getElementById("recents-row") as HTMLDivElement;
const recentsClear = document.getElementById("recents-clear") as HTMLButtonElement;
const modeSwitch = document.getElementById("mode-switch") as HTMLDivElement;
const modeBrand = document.getElementById("mode-brand") as HTMLButtonElement;
const modeUi = document.getElementById("mode-ui") as HTMLButtonElement;
const uiControls = document.getElementById("ui-controls") as HTMLDivElement;
const lookRow = document.getElementById("look-row") as HTMLDivElement;
const colorInput = document.getElementById("color-input") as HTMLInputElement;
const swatches = Array.from(
  document.querySelectorAll<HTMLButtonElement>(".swatch")
);

// ---- Helpers ----
function setLoading(show: boolean) {
  loading.style.display = show ? "flex" : "none";
  if (show) {
    grid.style.display = "none";
  } else {
    grid.style.display = "grid";
  }
}

function setStatus(text: string) {
  status.textContent = text;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function postToSandbox(message: unknown) {
  parent.postMessage({ pluginMessage: message }, "*");
}

// Build a preview URL using the actual variant path from icons.json.
// Falls back to a guessed path when we don't have variantPaths (recents).
function previewUrl(
  slug: string,
  variant = "default",
  paths?: Record<string, string>
) {
  if (paths) {
    const rel = paths[variant] || paths.default;
    if (rel) return `${CDN_ROOT}${rel}`;
  }
  return `${CDN_ROOT}/icons/${encodeURIComponent(slug)}/${encodeURIComponent(variant)}.svg`;
}

// ---- Insert flow ----
function insertIcon(slug: string, title: string, variant = "default") {
  postToSandbox({ type: "insert", slug, name: title, variant });
}

// ---- Variant menu ----
let openVariantMenu: HTMLDivElement | null = null;

function closeVariantMenu() {
  if (openVariantMenu) {
    openVariantMenu.remove();
    openVariantMenu = null;
  }
}

function showVariantMenu(
  anchor: HTMLElement,
  icon: IconEntry
) {
  closeVariantMenu();
  const menu = document.createElement("div");
  menu.className = "variant-menu";
  for (const v of icon.variants) {
    const item = document.createElement("button");
    item.className = "variant-item";
    item.innerHTML = `
      <img src="${previewUrl(icon.slug, v, icon.variantPaths)}" alt="${escapeHtml(v)}" />
      <span>${escapeHtml(v)}</span>
    `;
    item.addEventListener("click", (e) => {
      e.stopPropagation();
      insertIcon(icon.slug, icon.title, v);
      closeVariantMenu();
    });
    menu.appendChild(item);
  }
  const rect = anchor.getBoundingClientRect();
  menu.style.left = `${Math.min(rect.left, window.innerWidth - 200)}px`;
  menu.style.top = `${rect.bottom + 4}px`;
  document.body.appendChild(menu);
  openVariantMenu = menu;
}

// ---- Rendering ----
function renderGrid(icons: IconEntry[]) {
  grid.innerHTML = "";

  if (icons.length === 0) {
    grid.innerHTML = '<div class="empty">No icons found</div>';
    return;
  }

  for (const icon of icons) {
    const card = document.createElement("div");
    card.className = "icon-card";
    card.setAttribute("data-slug", icon.slug);

    const hasVariants = icon.variants.length > 1;

    card.innerHTML = `
      <button class="icon-card-main" title="Insert ${escapeHtml(icon.title)}">
        <div class="icon-preview">
          <img src="${previewUrl(icon.slug, "default", icon.variantPaths)}" alt="${escapeHtml(icon.title)}" loading="lazy" />
        </div>
        <span class="icon-name">${escapeHtml(icon.title)}</span>
      </button>
      ${
        hasVariants
          ? `<button class="variant-trigger" title="${icon.variants.length} variants" aria-label="Choose variant">${icon.variants.length}</button>`
          : ""
      }
    `;

    const mainBtn = card.querySelector(".icon-card-main") as HTMLButtonElement;
    mainBtn.addEventListener("click", () =>
      insertIcon(icon.slug, icon.title)
    );

    if (hasVariants) {
      const trigger = card.querySelector(
        ".variant-trigger"
      ) as HTMLButtonElement;
      trigger.addEventListener("click", (e) => {
        e.stopPropagation();
        showVariantMenu(trigger, icon);
      });
    }

    grid.appendChild(card);
  }
}

function renderRecents(recents: RecentEntry[]) {
  if (recents.length === 0) {
    recentsSection.style.display = "none";
    return;
  }
  recentsSection.style.display = "flex";
  recentsRow.innerHTML = "";
  for (const r of recents) {
    const card = document.createElement("button");
    card.className = "recent-card";
    card.title = `Reinsert ${r.title}${r.variant !== "default" ? " (" + r.variant + ")" : ""}`;
    card.innerHTML = `<img src="${previewUrl(r.slug, r.variant)}" alt="${escapeHtml(r.title)}" />`;
    card.addEventListener("click", () => insertIcon(r.slug, r.title, r.variant));
    recentsRow.appendChild(card);
  }
}

// ---- UI icons mode ----
function isLightColor(hex: string): boolean {
  const n = parseInt(hex.slice(1), 16);
  const lum =
    0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255);
  return lum > 186;
}

function applyUiColor(hex: string) {
  uiColor = hex.toLowerCase();
  colorInput.value = uiColor;
  for (const sw of swatches) {
    sw.classList.toggle("active", sw.dataset.color === uiColor);
  }
  grid.style.color = uiColor;
  // Light colors vanish on a light tile, so flip the preview tile.
  grid.classList.toggle("on-dark", isLightColor(uiColor));
  grid.classList.toggle("on-light", !isLightColor(uiColor));
}

function renderLooks() {
  lookRow.innerHTML = "";
  for (const look of uiLooks) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "look-btn" + (look === uiLook ? " active" : "");
    btn.textContent = look;
    btn.addEventListener("click", () => {
      if (look === uiLook) return;
      uiLook = look;
      renderLooks();
      loadUiSvgs();
    });
    lookRow.appendChild(btn);
  }
}

function fillUiPreview(slug: string) {
  const box = grid.querySelector(
    `[data-slug="${CSS.escape(slug)}"] .ui-preview`
  );
  const svg = uiSvgs.get(`${uiLook}/${slug}`);
  if (box && svg) box.innerHTML = svg;
}

function loadUiSvgs() {
  const missing = uiFiltered
    .map((i) => i.slug)
    .filter((slug) => !uiSvgs.has(`${uiLook}/${slug}`));
  for (const icon of uiFiltered) fillUiPreview(icon.slug);
  if (missing.length > 0) {
    postToSandbox({ type: "ui-load-svgs", look: uiLook, slugs: missing });
  }
}

function renderUiGrid() {
  grid.innerHTML = "";
  if (uiFiltered.length === 0) {
    grid.innerHTML = '<div class="empty">No icons found</div>';
    return;
  }
  for (const icon of uiFiltered) {
    const card = document.createElement("div");
    card.className = "icon-card";
    card.setAttribute("data-slug", icon.slug);
    card.innerHTML = `
      <button class="icon-card-main" title="Insert ${escapeHtml(icon.title)}">
        <div class="icon-preview ui-preview"></div>
        <span class="icon-name">${escapeHtml(icon.title)}</span>
      </button>
    `;
    const mainBtn = card.querySelector(".icon-card-main") as HTMLButtonElement;
    mainBtn.addEventListener("click", () => insertUiIcon(icon));
    grid.appendChild(card);
  }
  loadUiSvgs();
}

function insertUiIcon(icon: UiIconEntry) {
  postToSandbox({
    type: "ui-insert",
    slug: icon.slug,
    name: icon.title,
    look: uiLook,
    color: uiColor,
  });
}

function filterUi() {
  const q = uiQuery.toLowerCase();
  uiFiltered = uiIcons.filter((i) => {
    if (uiCategory !== "all" && i.category !== uiCategory) return false;
    if (!q) return true;
    return (
      i.title.toLowerCase().includes(q) ||
      i.slug.toLowerCase().includes(q) ||
      i.tags.some((t) => t.toLowerCase().includes(q))
    );
  });
  renderUiGrid();
  const total = uiFiltered.length.toLocaleString();
  const noun = uiFiltered.length === 1 ? "icon" : "icons";
  if (uiQuery) setStatus(`${total} UI ${noun} matching "${uiQuery}"`);
  else if (uiCategory !== "all") setStatus(`${total} UI ${noun} in ${uiCategory}`);
  else setStatus(`${total} UI ${noun}`);
}

function populateUiCategories() {
  const counts = new Map<string, number>();
  for (const i of uiIcons) counts.set(i.category, (counts.get(i.category) || 0) + 1);
  categorySelect.innerHTML = '<option value="all">All</option>';
  for (const [name, count] of [...counts.entries()].sort((a, b) =>
    a[0].localeCompare(b[0])
  )) {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = `${name} (${count})`;
    categorySelect.appendChild(option);
  }
  categorySelect.value = uiCategory;
}

function setMode(next: Mode) {
  if (next === mode) return;
  if (mode === "brand") {
    brandQuery = currentQuery;
    brandCategory = currentCategory;
    brandCategoryOptions = categorySelect.innerHTML;
  } else {
    uiQuery = currentQuery;
    uiCategory = currentCategory;
  }
  mode = next;
  closeVariantMenu();
  modeBrand.classList.toggle("active", mode === "brand");
  modeUi.classList.toggle("active", mode === "ui");
  modeBrand.setAttribute("aria-selected", String(mode === "brand"));
  modeUi.setAttribute("aria-selected", String(mode === "ui"));
  uiControls.classList.toggle("hidden", mode !== "ui");
  grid.classList.toggle("on-dark", false);
  grid.classList.toggle("on-light", false);
  grid.style.color = "";

  if (mode === "ui") {
    currentQuery = uiQuery;
    currentCategory = uiCategory;
    searchInput.value = uiQuery;
    searchInput.placeholder = `Search ${uiIcons.length.toLocaleString()} UI icons...`;
    recentsSection.style.display = "none";
    populateUiCategories();
    renderLooks();
    applyUiColor(uiColor);
    setLoading(false);
    filterUi();
  } else {
    currentQuery = brandQuery;
    currentCategory = brandCategory;
    searchInput.value = brandQuery;
    searchInput.placeholder = "Search 7,600+ brand icons...";
    categorySelect.innerHTML = brandCategoryOptions;
    categorySelect.value = brandCategory;
    postToSandbox({ type: "load-recents" });
    performSearch();
  }
}

// ---- Search ----
function performSearch() {
  if (mode === "ui") {
    filterUi();
    return;
  }
  setLoading(true);
  postToSandbox({
    type: "search",
    query: currentQuery,
    category: currentCategory,
  });
}

// ---- Sandbox responses ----
window.onmessage = (event: MessageEvent) => {
  const msg = event.data.pluginMessage;
  if (!msg) return;

  if (mode === "ui" && (msg.type === "search-results" || msg.type === "search-error" || msg.type === "recents")) {
    return;
  }

  if (msg.type === "ui-index") {
    uiIcons = msg.data.icons;
    uiLooks = msg.data.looks;
    uiLook = uiLooks.includes("outline") ? "outline" : uiLooks[0];
    if (uiIcons.length > 0 && uiLooks.length > 0) {
      modeSwitch.classList.remove("hidden");
    }
  }

  // Unavailable index: the switch simply stays hidden and brand mode is unchanged.

  if (msg.type === "ui-svgs") {
    for (const slug of Object.keys(msg.items)) {
      uiSvgs.set(`${msg.look}/${slug}`, msg.items[slug]);
      if (mode === "ui" && msg.look === uiLook) fillUiPreview(slug);
    }
  }

  if (msg.type === "search-results") {
    setLoading(false);
    const data = msg.data;
    lastResults = data.icons;
    renderGrid(data.icons);
    const total = data.total.toLocaleString();
    const noun = data.total === 1 ? "icon" : "icons";
    if (currentQuery) {
      setStatus(`${total} ${noun} matching "${currentQuery}"`);
    } else if (currentCategory !== "all") {
      setStatus(`${total} ${noun} in ${currentCategory}`);
    } else {
      setStatus(`${total} ${noun} in the catalog`);
    }
  }

  if (msg.type === "search-error") {
    setLoading(false);
    setStatus(`Error: ${msg.error}`);
    grid.innerHTML =
      '<div class="empty">Failed to load icons. Check your connection.</div>';
  }

  if (msg.type === "categories") {
    const categories: Array<{ name: string; count: number }> = msg.data;
    // Build into a detached select so a late reply never pollutes UI mode's list.
    const target =
      mode === "brand" ? categorySelect : document.createElement("select");
    if (mode === "ui") target.innerHTML = brandCategoryOptions;
    for (const cat of categories) {
      const option = document.createElement("option");
      option.value = cat.name;
      option.textContent = `${cat.name} (${cat.count})`;
      target.appendChild(option);
    }
    if (mode === "ui") brandCategoryOptions = target.innerHTML;
  }

  if (msg.type === "insert-status") {
    const card = grid.querySelector(
      `[data-slug="${msg.slug}"]`
    ) as HTMLDivElement | null;
    if (card) {
      if (msg.status === "loading") card.classList.add("inserting");
      else card.classList.remove("inserting");
    }
  }

  if (msg.type === "recents") {
    renderRecents(msg.data);
  }
};

// ---- Event handlers ----
searchInput.addEventListener("input", () => {
  currentQuery = searchInput.value.trim();
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(performSearch, 300);
});

categorySelect.addEventListener("change", () => {
  currentCategory = categorySelect.value;
  performSearch();
});

recentsClear.addEventListener("click", () => {
  postToSandbox({ type: "clear-recents" });
});

// Insert first result on Enter from the search box
searchInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && mode === "ui" && uiFiltered.length > 0) {
    e.preventDefault();
    insertUiIcon(uiFiltered[0]);
    return;
  }
  if (e.key === "Enter" && mode === "brand" && lastResults.length > 0) {
    e.preventDefault();
    const first = lastResults[0];
    insertIcon(first.slug, first.title);
  }
});

// Global keyboard shortcuts
window.addEventListener("keydown", (e) => {
  // Esc: close variant menu, then close plugin
  if (e.key === "Escape") {
    if (openVariantMenu) {
      closeVariantMenu();
      e.preventDefault();
      return;
    }
    postToSandbox({ type: "close" });
    return;
  }
  // Cmd/Ctrl+F focuses search
  if ((e.metaKey || e.ctrlKey) && e.key === "f") {
    e.preventDefault();
    searchInput.focus();
    searchInput.select();
  }
});

// Click outside the variant menu closes it
document.addEventListener("click", (e) => {
  if (openVariantMenu && !openVariantMenu.contains(e.target as Node)) {
    closeVariantMenu();
  }
});

modeBrand.addEventListener("click", () => setMode("brand"));
modeUi.addEventListener("click", () => setMode("ui"));

for (const sw of swatches) {
  sw.addEventListener("click", () => applyUiColor(sw.dataset.color || "#111111"));
}
colorInput.addEventListener("input", () => applyUiColor(colorInput.value));

// ---- Init ----
// Lazy and fail-soft: the switch stays hidden unless the UI index loads.
postToSandbox({ type: "ui-load-index" });
postToSandbox({ type: "load-categories" });
postToSandbox({ type: "load-recents" });
performSearch();
