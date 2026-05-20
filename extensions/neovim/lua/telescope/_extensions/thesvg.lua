-- Telescope extension entry point for thesvg
-- Register with: require('telescope').load_extension('thesvg')

local telescope = require("telescope")

return telescope.register_extension({
  exports = {
    -- :Telescope thesvg   or  require('telescope').extensions.thesvg.thesvg()
    thesvg = function(_opts)
      require("thesvg").pick()
    end,
  },
})
