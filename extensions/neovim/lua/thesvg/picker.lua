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

--- Capture the current insertion target (buffer, window, cursor position)
--- at this moment. Pass the returned target table to insert_text so async
--- inserts land in the place the user invoked the picker from, even if they
--- moved focus during the fetch.
---@return table target  { buf: integer, win: integer, row: integer, col: integer }
local function capture_target()
  local win = vim.api.nvim_get_current_win()
  local buf = vim.api.nvim_get_current_buf()
  local row, col = unpack(vim.api.nvim_win_get_cursor(win))
  return { buf = buf, win = win, row = row, col = col }
end

--- Insert text at the captured target. Handles multi-line text by splitting
--- on newlines (nvim_buf_set_lines rejects strings containing \n, which is
--- what an inline SVG body always contains).
---@param target table  { buf, win, row, col } captured before the async fetch
---@param text string
local function insert_text(target, text)
  if not vim.api.nvim_buf_is_valid(target.buf) then
    vim.notify("[thesvg] insert target buffer no longer exists", vim.log.levels.WARN)
    return
  end

  local row, col = target.row, target.col
  local current = vim.api.nvim_buf_get_lines(target.buf, row - 1, row, false)[1] or ""
  local parts = vim.split(text, "\n", { plain = true })

  if #parts == 1 then
    local new_line = current:sub(1, col) .. parts[1] .. current:sub(col + 1)
    vim.api.nvim_buf_set_lines(target.buf, row - 1, row, false, { new_line })
    if vim.api.nvim_win_is_valid(target.win) then
      vim.api.nvim_win_set_cursor(target.win, { row, col + #parts[1] })
    end
    return
  end

  local last_part = parts[#parts]
  local replacement = { current:sub(1, col) .. parts[1] }
  for i = 2, #parts - 1 do
    replacement[#replacement + 1] = parts[i]
  end
  replacement[#replacement + 1] = last_part .. current:sub(col + 1)

  vim.api.nvim_buf_set_lines(target.buf, row - 1, row, false, replacement)
  if vim.api.nvim_win_is_valid(target.win) then
    vim.api.nvim_win_set_cursor(target.win, { row + #parts - 1, #last_part })
  end
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
local function on_select(icon, config, target)
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
      insert_text(target, vim.trim(body))
    end)
  else
    -- Default: insert CDN URL.
    local url = cdn_url(icon.slug, variant)
    insert_text(target, url)
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

  -- Capture the originating buffer / window / cursor before the picker
  -- floats over the screen so the async insert lands in the right place
  -- even if the user clicks away during the SVG fetch.
  local target = capture_target()

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
          on_select(selection.value, config, target)
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

  local target = capture_target()

  vim.ui.select(items, {
    prompt = "theSVG Icons",
    format_item = function(item)
      return item
    end,
  }, function(_, idx)
    if idx then
      on_select(icons[idx], config, target)
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

-- UI icons: separate kind with its own CDN path and a look per icon.
-- SVGs use currentColor, so the inserted text is left untouched.
-- The per-icon files are served by the site, not committed to the repo.
local UI_CDN_BASE = "https://thesvg.org/ui"

---@param slug string
---@param look string
---@return string
local function ui_url(slug, look)
  return UI_CDN_BASE .. "/" .. slug .. "/" .. look .. ".svg"
end

--- Insert (or fetch then insert) a UI icon in the chosen look.
local function insert_ui(icon, look, config, target)
  local url = ui_url(icon.slug, look)
  if config.insert_mode ~= "inline" then
    insert_text(target, url)
    return
  end
  vim.notify("[thesvg] fetching " .. icon.slug .. " (" .. look .. ")...", vim.log.levels.INFO)
  require("thesvg.http").get_async(url, 5000, function(body, err)
    if not body then
      vim.notify("[thesvg] failed to fetch SVG: " .. (err or "unknown"), vim.log.levels.ERROR)
      return
    end
    insert_text(target, vim.trim(body))
  end)
end

--- Use the requested look, or ask for one (outline first) when none was given.
local function on_select_ui(icon, index, config, target, look)
  if not icon then
    return
  end
  if look and look ~= "" then
    insert_ui(icon, look, config, target)
    return
  end
  vim.ui.select(index.looks, { prompt = "theSVG look" }, function(choice)
    if choice then
      insert_ui(icon, choice, config, target)
    end
  end)
end

local function ui_display(icon)
  return string.format("%-32s  %-24s  %s", icon.title or icon.slug, icon.slug, icon.category or "")
end

--- Open a picker over the UI icon index.
---@param index table  { looks: string[], icons: table[] }
---@param config table
---@param look? string  fixed look; prompts when nil
function M.open_ui(index, config, look)
  local target = capture_target()
  local icons = index.icons

  local ok, pickers = pcall(require, "telescope.pickers")
  if ok then
    local finders = require("telescope.finders")
    local actions = require("telescope.actions")
    local action_state = require("telescope.actions.state")
    local conf = require("telescope.config").values
    pickers.new({}, {
      prompt_title = "theSVG UI Icons",
      finder = finders.new_table({
        results = icons,
        entry_maker = function(icon)
          local tags = type(icon.tags) == "table" and table.concat(icon.tags, " ") or ""
          return {
            value = icon,
            display = ui_display(icon),
            ordinal = table.concat({ icon.title or "", icon.slug or "", icon.category or "", tags }, " "),
          }
        end,
      }),
      sorter = conf.generic_sorter({}),
      attach_mappings = function(prompt_bufnr)
        actions.select_default:replace(function()
          actions.close(prompt_bufnr)
          local selection = action_state.get_selected_entry()
          if selection then
            on_select_ui(selection.value, index, config, target, look)
          end
        end)
        return true
      end,
    }):find()
    return
  end

  local items = {}
  for _, icon in ipairs(icons) do
    items[#items + 1] = ui_display(icon)
  end
  vim.ui.select(items, { prompt = "theSVG UI Icons" }, function(_, idx)
    if idx then
      on_select_ui(icons[idx], index, config, target, look)
    end
  end)
end

return M
