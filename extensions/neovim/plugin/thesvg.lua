-- plugin/thesvg.lua: user-facing commands for the thesvg plugin
-- Loaded automatically by Neovim's plugin loader.

if vim.g.loaded_thesvg then
  return
end
vim.g.loaded_thesvg = true

-- :TheSVG - open the picker using the current insert_mode config
vim.api.nvim_create_user_command("TheSVG", function()
  require("thesvg").pick()
end, { desc = "theSVG: open icon picker" })

-- :TheSVGInsert - open picker and insert inline SVG at cursor
vim.api.nvim_create_user_command("TheSVGInsert", function()
  require("thesvg").insert_inline()
end, { desc = "theSVG: pick and insert inline SVG at cursor" })

-- :TheSVGPath - open picker and insert CDN URL at cursor
vim.api.nvim_create_user_command("TheSVGPath", function()
  require("thesvg").insert_url()
end, { desc = "theSVG: pick and insert CDN URL at cursor" })

-- UI icons (separate index). Optional argument is the look; omit it to be asked.
local function ui_command(name, mode, desc)
  vim.api.nvim_create_user_command(name, function(opts)
    require("thesvg").pick_ui(opts.args, mode)
  end, {
    nargs = "?",
    desc = desc,
    complete = function()
      return require("thesvg").ui_looks()
    end,
  })
end

ui_command("TheSVGUI", nil, "theSVG: open UI icon picker [look]")
ui_command("TheSVGUIInsert", "inline", "theSVG: pick UI icon, insert inline SVG [look]")
ui_command("TheSVGUIPath", "url", "theSVG: pick UI icon, insert CDN URL [look]")
