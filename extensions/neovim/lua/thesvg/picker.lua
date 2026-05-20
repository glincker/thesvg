-- picker.lua: Telescope picker with vim.ui.select fallback for thesvg plugin

local M = {}

local CDN_BASE =
  "https://cdn.jsdelivr.net/gh/glincker/thesvg@main/public/icons"

--- Build the CDN URL for a given slug and variant.
---@param slug string
---@param variant string
---@return string
local function cdn_url(slug, variant)
  return CDN_BASE .. "/" .. slug .. "/" .. variant .. ".svg"
end

--- Insert text at the current cursor position. Handles multi-line text by
--- splitting on newlines (nvim_buf_set_lines rejects strings containing \n,
--- which is what an inline SVG body always contains).
---@param text string
local function insert_at_cursor(text)
  local row, col = unpack(vim.api.nvim_win_get_cursor(0))
  local current = vim.api.nvim_buf_get_lines(0, row - 1, row, false)[1] or ""
  local parts = vim.split(text, "\n", { plain = true })

  if #parts == 1 then
    local new_line = current:sub(1, col) .. parts[1] .. current:sub(col + 1)
    vim.api.nvim_buf_set_lines(0, row - 1, row, false, { new_line })
    vim.api.nvim_win_set_cursor(0, { row, col + #parts[1] })
    return
  end

  local last_part = parts[#parts]
  local replacement = { current:sub(1, col) .. parts[1] }
  for i = 2, #parts - 1 do
    replacement[#replacement + 1] = parts[i]
  end
  replacement[#replacement + 1] = last_part .. current:sub(col + 1)

  vim.api.nvim_buf_set_lines(0, row - 1, row, false, replacement)
  vim.api.nvim_win_set_cursor(0, { row + #parts - 1, #last_part })
end

--- Derive the display variant (respects opts.variant, falls back to "default").
---@param icon table
---@param variant string
---@return string  the resolved variant name that exists on this icon
local function resolve_variant(icon, variant)
  if icon.variants and icon.variants[variant] then
    return variant
  end
  return "default"
end

--- Handle the action after an icon is chosen.
---@param icon table
---@param config table  plugin config
local function on_select(icon, config)
  if not icon then
    return
  end

  local variant = resolve_variant(icon, config.variant or "default")

  if config.insert_mode == "inline" then
    local http = require("thesvg.http")
    local url = cdn_url(icon.slug, variant)
    vim.notify("[thesvg] fetching " .. icon.slug .. "...", vim.log.levels.INFO)
    http.get_async(url, 5000, function(body, err)
      if not body then
        vim.notify("[thesvg] failed to fetch SVG: " .. (err or "unknown"), vim.log.levels.ERROR)
        return
      end
      insert_at_cursor(vim.trim(body))
    end)
  else
    -- Default: insert CDN URL.
    local url = cdn_url(icon.slug, variant)
    insert_at_cursor(url)
  end
end

--- Format the icon entry for display.
---@param icon table
---@return string
local function display_string(icon)
  local hex = icon.hex and ("#" .. icon.hex) or ""
  return string.format("%-36s  %-24s  %s", icon.title or icon.slug, icon.slug, hex)
end

--- Build ordinal string for Telescope fuzzy search (title + slug + aliases).
---@param icon table
---@return string
local function ordinal_string(icon)
  local parts = { icon.title or "", icon.slug or "" }
  if type(icon.aliases) == "table" then
    for _, alias in ipairs(icon.aliases) do
      parts[#parts + 1] = tostring(alias)
    end
  end
  return table.concat(parts, " ")
end

--- Open a Telescope picker for thesvg icons.
---@param icons table[]
---@param config table
local function open_telescope(icons, config)
  local ok, modules = pcall(function()
    return {
      telescope = require("telescope"),
      pickers = require("telescope.pickers"),
      finders = require("telescope.finders"),
      conf = require("telescope.config").values,
      actions = require("telescope.actions"),
      action_state = require("telescope.actions.state"),
    }
  end)
  if not ok then
    vim.notify("[thesvg] telescope unavailable, falling back to vim.ui.select", vim.log.levels.DEBUG)
    return false
  end

  local pickers = modules.pickers
  local finders = modules.finders
  local conf = modules.conf
  local actions = modules.actions
  local action_state = modules.action_state

  pickers.new({}, {
    prompt_title = "theSVG Icons",
    finder = finders.new_table({
      results = icons,
      entry_maker = function(icon)
        return {
          value = icon,
          display = display_string(icon),
          ordinal = ordinal_string(icon),
        }
      end,
    }),
    sorter = conf.generic_sorter({}),
    attach_mappings = function(prompt_bufnr, _map)
      actions.select_default:replace(function()
        actions.close(prompt_bufnr)
        local selection = action_state.get_selected_entry()
        if selection then
          on_select(selection.value, config)
        end
      end)
      return true
    end,
  }):find()

  return true
end

--- Open a vim.ui.select picker for thesvg icons (fallback).
---@param icons table[]
---@param config table
local function open_select(icons, config)
  local items = {}
  for _, icon in ipairs(icons) do
    items[#items + 1] = display_string(icon)
  end

  vim.ui.select(items, {
    prompt = "theSVG Icons",
    format_item = function(item)
      return item
    end,
  }, function(_, idx)
    if idx then
      on_select(icons[idx], config)
    end
  end)
end

--- Entry point: open whichever picker is available.
---@param icons table[]
---@param config table
function M.open(icons, config)
  if not open_telescope(icons, config) then
    open_select(icons, config)
  end
end

return M
