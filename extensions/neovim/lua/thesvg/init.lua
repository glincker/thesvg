-- init.lua: public API and setup for the thesvg Neovim plugin

local M = {}

---@class ThesvgConfig
---@field insert_mode "url"|"inline"   how to insert on selection (default: "url")
---@field variant string               SVG variant to use (default: "default")
---@field cache_ttl integer            registry cache TTL in seconds (default: 86400)

---@type ThesvgConfig
local defaults = {
  insert_mode = "url",
  variant = "default",
  cache_ttl = 86400,
}

---@type ThesvgConfig
M.config = vim.deepcopy(defaults)

--- Initialize the plugin with user options.
---@param opts? ThesvgConfig
function M.setup(opts)
  M.config = vim.tbl_deep_extend("force", defaults, opts or {})
end

--- Open the icon picker.
function M.pick()
  local cache = require("thesvg.cache")
  local picker = require("thesvg.picker")

  local icons = cache.get_registry({ ttl = M.config.cache_ttl })
  picker.open(icons, M.config)
end

--- Open picker, inserting the CDN URL on selection (overrides config temporarily).
function M.insert_url()
  local cfg = vim.tbl_extend("force", M.config, { insert_mode = "url" })
  local cache = require("thesvg.cache")
  local picker = require("thesvg.picker")
  local icons = cache.get_registry({ ttl = cfg.cache_ttl })
  picker.open(icons, cfg)
end

--- Open picker, inserting inline SVG on selection (overrides config temporarily).
function M.insert_inline()
  local cfg = vim.tbl_extend("force", M.config, { insert_mode = "inline" })
  local cache = require("thesvg.cache")
  local picker = require("thesvg.picker")
  local icons = cache.get_registry({ ttl = cfg.cache_ttl })
  picker.open(icons, cfg)
end

--- Open the UI icon picker. The UI index is loaded on first use; any failure
--- is reported as one line and leaves brand search untouched.
---@param look? string  fixed look (e.g. "fill"); prompts when omitted
---@param mode? "url"|"inline"  overrides config.insert_mode
function M.pick_ui(look, mode)
  local cfg = vim.tbl_extend("force", M.config, { insert_mode = mode or M.config.insert_mode })
  local index, err = require("thesvg.cache").get_ui_index({ ttl = cfg.cache_ttl })
  if not index then
    vim.notify("[thesvg] " .. err, vim.log.levels.WARN)
    return
  end
  if look and look ~= "" and not vim.tbl_contains(index.looks, look) then
    vim.notify("[thesvg] unknown look '" .. look .. "', use one of: " .. table.concat(index.looks, ", "), vim.log.levels.WARN)
    return
  end
  require("thesvg.picker").open_ui(index, cfg, look)
end

--- Known look names for command completion (no network; cache only).
---@return string[]
function M.ui_looks()
  return { "outline", "glass", "duotone", "offset", "fill", "pixel", "depth" }
end

return M
