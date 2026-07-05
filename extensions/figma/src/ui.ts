// theSVG Figma Plugin - UI thread (iframe)
// No network requests here; all fetches happen in the sandbox (main.ts).

const CDN_ROOT = "https://cdn.jsdelivr.net/gh/glincker/thesvg@main/public";

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

// ---- State ----
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
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
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

// ---- Search ----
function performSearch() {
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
    for (const cat of categories) {
      const option = document.createElement("option");
      option.value = cat.name;
      option.textContent = `${cat.name} (${cat.count})`;
      categorySelect.appendChild(option);
    }
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
  if (e.key === "Enter" && lastResults.length > 0) {
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

// ---- Init ----
postToSandbox({ type: "load-categories" });
postToSandbox({ type: "load-recents" });
performSearch();
