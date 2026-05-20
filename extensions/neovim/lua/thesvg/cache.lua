-- cache.lua: on-disk JSON registry cache for thesvg plugin
-- Cache location: stdpath('cache')/thesvg/registry.json
-- Default TTL: 86400 seconds (24 h)

local M = {}

local REGISTRY_URL =
  "https://cdn.jsdelivr.net/gh/glincker/thesvg@main/src/data/icons.json"
local REGISTRY_URL_FALLBACK = "https://thesvg.org/api/registry.json"

-- Popular fallback list shown when the registry cannot be fetched.
---@type table[]
local FALLBACK_ICONS = {
  { slug = "github",      title = "GitHub",      hex = "181717", variants = { default = true } },
  { slug = "stripe",      title = "Stripe",      hex = "635BFF", variants = { default = true } },
  { slug = "figma",       title = "Figma",       hex = "F24E1E", variants = { default = true } },
  { slug = "vercel",      title = "Vercel",      hex = "000000", variants = { default = true } },
  { slug = "npm",         title = "npm",         hex = "CB3837", variants = { default = true } },
  { slug = "docker",      title = "Docker",      hex = "2496ED", variants = { default = true } },
  { slug = "kubernetes",  title = "Kubernetes",  hex = "326CE5", variants = { default = true } },
  { slug = "openai",      title = "OpenAI",      hex = "412991", variants = { default = true } },
  { slug = "anthropic",   title = "Anthropic",   hex = "191919", variants = { default = true } },
  { slug = "tailwindcss", title = "Tailwind CSS",hex = "06B6D4", variants = { default = true } },
}

---@return string  path to the cache file
local function cache_path()
  local dir = vim.fs.joinpath(vim.fn.stdpath("cache"), "thesvg")
  vim.fn.mkdir(dir, "p")
  return vim.fs.joinpath(dir, "registry.json")
end

---@return boolean  true when the cache file exists and is fresh
local function is_fresh(ttl)
  local path = cache_path()
  local stat = vim.uv.fs_stat(path)
  if not stat then
    return false
  end
  local age = os.time() - stat.mtime.sec
  return age < ttl
end

--- Load and decode the on-disk cache.
---@return table[]|nil
local function load_disk_cache()
  local path = cache_path()
  local fd = io.open(path, "r")
  if not fd then
    return nil
  end
  local raw = fd:read("*a")
  fd:close()
  local ok, data = pcall(vim.json.decode, raw)
  if not ok or type(data) ~= "table" then
    return nil
  end
  return data
end

--- Persist icons table to disk.
---@param icons table[]
local function save_disk_cache(icons)
  local path = cache_path()
  local ok, encoded = pcall(vim.json.encode, icons)
  if not ok then
    return
  end
  local fd = io.open(path, "w")
  if not fd then
    return
  end
  fd:write(encoded)
  fd:close()
end

--- Parse the raw JSON registry string into a list of icon entries.
---@param raw string
---@return table[]|nil, string|nil
local function parse_registry(raw)
  local ok, data = pcall(vim.json.decode, raw)
  if not ok then
    return nil, "JSON parse error"
  end
  if type(data) ~= "table" then
    return nil, "unexpected registry shape"
  end
  -- The registry may be an array or an object keyed by slug.
  if vim.islist(data) then
    return data, nil
  end
  -- Convert object form to array.
  local list = {}
  for slug, entry in pairs(data) do
    if type(entry) == "table" then
      entry.slug = entry.slug or slug
      list[#list + 1] = entry
    end
  end
  return list, nil
end

--- Return the icon registry, fetching and caching as needed.
--- Never throws; falls back to FALLBACK_ICONS on any failure.
---@param opts? { ttl?: integer, http?: table }
---@return table[]
function M.get_registry(opts)
  opts = opts or {}
  local ttl = opts.ttl or 86400
  local http = opts.http or require("thesvg.http")

  -- Serve from disk cache when still fresh.
  if is_fresh(ttl) then
    local cached = load_disk_cache()
    if cached and #cached > 0 then
      return cached
    end
  end

  -- Try primary URL then fallback URL. Short per-URL timeout (3s) so a
  -- network stall on first :TheSVG only freezes the editor for at most
  -- ~6 seconds in the worst case. The whole flow is on the main thread
  -- because :TheSVG needs the icon list to open the picker; a fully
  -- async path is a v1.1 task. Once a successful fetch lands on disk
  -- everything after that is instant.
  vim.notify("[thesvg] loading registry...", vim.log.levels.INFO)
  local urls = { REGISTRY_URL, REGISTRY_URL_FALLBACK }
  for _, url in ipairs(urls) do
    local body, err = http.get(url, 3000)
    if body then
      local icons, parse_err = parse_registry(body)
      if icons and #icons > 0 then
        save_disk_cache(icons)
        return icons
      end
      if parse_err then
        vim.notify("[thesvg] registry parse error: " .. parse_err, vim.log.levels.WARN)
      end
    else
      vim.notify("[thesvg] fetch failed (" .. url .. "): " .. (err or "unknown"), vim.log.levels.DEBUG)
    end
  end

  vim.notify("[thesvg] using built-in fallback icon list (no network)", vim.log.levels.WARN)
  return FALLBACK_ICONS
end

return M
