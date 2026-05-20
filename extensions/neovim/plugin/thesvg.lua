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
