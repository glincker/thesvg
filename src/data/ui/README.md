# UI icon data

The only hand-maintained UI icon data lives here. Everything else is generated from it.

- `sets/<id>.json`: one file per release set (name, note, release date) and one line per icon (slug, tags, geometry). Adding an icon or a drop is a small diff to one file. The file name must equal the set id.
- `popular.json`: the slugs shown first on the UI icons home.

After changing anything here run:

```sh
pnpm ui:build
```

It renders `public/ui/<slug>/<look>.svg` (seven looks per icon), `src/data/ui-icons.json` (the manifest the extensions and packages read) and `src/lib/ui-icons/sets.generated.ts` (the site's import list). Commit those with the change. `pnpm ui:check` fails if the committed output is out of date, and it runs as part of `pnpm test`.

The npm packages (`@thesvg/ui*`) are built from the generated files by the shared builder in `scripts/ui`, so a new icon needs no package changes.
