// theSVG Figma Plugin - UI thread (iframe)
// No network requests here - all fetches happen in the sandbox (main.ts)
// to avoid CORS issues with the null-origin iframe

const CDN_BASE =
  "https://cdn.jsdelivr.net/gh/glincker/thesvg@main/public/icons";

interface IconEntry {
  slug: string;
  title: string;
  categories: string[];
  variants: string[];
}

// ---- State ----
let currentQuery = "";
let currentCategory = "all";
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

// ---- DOM refs ----
const searchInput = document.getElementById("search") as HTMLInputElement;
const categorySelect = document.getElementById("category") as HTMLSelectElement;
const grid = document.getElementById("grid") as HTMLDivElement;
const status = document.getElementById("status") as HTMLDivElement;
const loading = document.getElementById("loading") as HTMLDivElement;

// ---- Rendering ----
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

function renderGrid(icons: IconEntry[]) {
  grid.innerHTML = "";

  if (icons.length === 0) {
    grid.innerHTML = '<div class="empty">No icons found</div>';
    return;
  }

  for (const icon of icons) {
    const card = document.createElement("button");
    card.className = "icon-card";
    card.title = `Insert ${icon.title}`;
    card.setAttribute("data-slug", icon.slug);

    // Use jsDelivr CDN for preview (no CORS/redirect issues)
    const previewUrl = `${CDN_BASE}/${encodeURIComponent(icon.slug)}/default.svg`;

    card.innerHTML = `
      <div class="icon-preview">
        <img src="${previewUrl}" alt="${escapeHtml(icon.title)}" loading="lazy" />
      </div>
      <span class="icon-name">${escapeHtml(icon.title)}</span>
    `;

    card.addEventListener("click", () => {
      // Tell the sandbox to fetch + insert
      parent.postMessage(
        {
          pluginMessage: {
            type: "insert",
            slug: icon.slug,
            name: icon.title,
          },
        },
        "*"
      );
    });

    grid.appendChild(card);
  }
}

// ---- Search ----
function performSearch() {
  setLoading(true);
  parent.postMessage(
    {
      pluginMessage: {
        type: "search",
        query: currentQuery,
        category: currentCategory,
      },
    },
    "*"
  );
}

// ---- Message handler (responses from sandbox) ----
window.onmessage = (event: MessageEvent) => {
  const msg = event.data.pluginMessage;
  if (!msg) return;

  if (msg.type === "search-results") {
    setLoading(false);
    const data = msg.data;
    renderGrid(data.icons);
    setStatus(
      `${data.total.toLocaleString()} icon${data.total !== 1 ? "s" : ""}${currentQuery ? ` matching "${currentQuery}"` : ""}`
    );
  }

  if (msg.type === "search-error") {
    setLoading(false);
    setStatus(`Error: ${msg.error}`);
    grid.innerHTML = '<div class="empty">Failed to load icons</div>';
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
    ) as HTMLButtonElement | null;
    if (card) {
      if (msg.status === "loading") {
        card.classList.add("inserting");
      } else {
        card.classList.remove("inserting");
      }
    }
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

// ---- Init ----
parent.postMessage({ pluginMessage: { type: "load-categories" } }, "*");
performSearch();
