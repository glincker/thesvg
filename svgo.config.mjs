const config = {
  plugins: [
    {
      name: "preset-default",
      params: {
        overrides: {
          // The contributor guide and validate-svg.yml both require an
          // explicit viewBox on every icon SVG, but SVGO's default preset
          // strips it whenever it exactly matches width/height (treating
          // it as "redundant"). That silently broke every icon whose
          // source file has square width/height/viewBox, right after the
          // svgo.yml auto-commit ran. Keep viewBox always.
          removeViewBox: false,
          // AGENTS.md requires a <title> with the brand name in every
          // icon; SVGO 3's default preset strips it.
          removeTitle: false,
        },
      },
    },
  ],
};
export default config;
