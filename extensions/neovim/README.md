# thesvg.nvim

Neovim plugin for [theSVG](https://thesvg.org) -- The Open SVG Brand Library.

Search 6,030+ brand SVGs from a Telescope picker (or `vim.ui.select` fallback) and either
insert the CDN URL or inline SVG content at the cursor.

## Requirements

- Neovim 0.10 or later
- `curl` available in `$PATH`
- [nvim-telescope/telescope.nvim](https://github.com/nvim-telescope/telescope.nvim) (optional)

## Installation

### lazy.nvim

```lua
{
  "glincker/thesvg",
  -- subdir = "extensions/neovim",  -- when using the monorepo directly
  -- For the dedicated plugin repo (coming soon): "glincker/thesvg.nvim"
  opts = {
    insert_mode = "url",   -- "url" | "inline"
    variant     = "default",
    cache_ttl   = 86400,
  },
  keys = {
    { "<leader>sv", "<cmd>TheSVG<cr>",       desc = "theSVG: pick icon" },
    { "<leader>si", "<cmd>TheSVGInsert<cr>", desc = "theSVG: insert inline SVG" },
    { "<leader>sp", "<cmd>TheSVGPath<cr>",   desc = "theSVG: insert CDN URL" },
  },
  config = function(_, opts)
    require("thesvg").setup(opts)
    -- optional: register Telescope extension
    require("telescope").load_extension("thesvg")
  end,
}
```

### packer.nvim

```lua
use {
  "glincker/thesvg",
  config = function()
    require("thesvg").setup({ insert_mode = "url" })
    require("telescope").load_extension("thesvg")
  end,
}
```

## Commands

| Command | Description |
|---------|-------------|
| `:TheSVG` | Open the icon picker (respects `insert_mode` config) |
| `:TheSVGInsert` | Open picker, insert inline SVG at cursor |
| `:TheSVGPath` | Open picker, insert CDN URL at cursor |
| `:Telescope thesvg` | Open Telescope picker directly |

## Configuration

```lua
require("thesvg").setup({
  -- "url"    inserts the jsDelivr CDN URL
  -- "inline" fetches and pastes the raw SVG at the cursor
  insert_mode = "url",

  -- SVG variant. Falls back to "default" when unavailable.
  -- Options: "default", "mono", "light", "dark", "wordmark"
  variant = "default",

  -- Registry cache lifetime in seconds (default: 24 h)
  cache_ttl = 86400,
})
```

## CDN URL format

```
https://cdn.jsdelivr.net/gh/glincker/thesvg@main/public/icons/{slug}/{variant}.svg
```

## Keybinding examples

```lua
vim.keymap.set("n", "<leader>sv", "<cmd>TheSVG<cr>",       { desc = "theSVG picker" })
vim.keymap.set("n", "<leader>si", "<cmd>TheSVGInsert<cr>", { desc = "theSVG inline SVG" })
vim.keymap.set("n", "<leader>sp", "<cmd>TheSVGPath<cr>",   { desc = "theSVG CDN URL" })
```

## How it works

1. On first run the registry is fetched from jsDelivr CDN and cached at
   `stdpath('cache')/thesvg/registry.json` for 24 hours.
2. Telescope (or `vim.ui.select`) opens with every icon searchable by name, slug, or alias.
3. Press `<CR>` to select. The CDN URL or inline SVG is inserted at the cursor.

When the network is unavailable, a built-in list of 10 popular icons is shown so the
picker remains usable offline.

## License

MIT. See [LICENSE](LICENSE).
