# CDN, API and mirrors

Serve icons from a CDN or consume the static manifest.

Back to the [README](../README.md).

## CDN

Use any icon directly without installing:

```html
<!-- From thesvg.org -->
<img src="https://thesvg.org/icons/github/default.svg" width="32" height="32" alt="GitHub" />

<!-- From jsDelivr -->
<img src="https://cdn.jsdelivr.net/gh/glincker/thesvg@main/public/icons/github/default.svg" width="32" height="32" alt="GitHub" />
```

**URL pattern:** `https://thesvg.org/icons/{slug}/{variant}.svg`

## API

thesvg ships as a fully static site, served from a CDN. There is no dynamic API; instead, two pre-built JSON manifests cover every use case. Search, filter, and pagination happen on the client.

Base URL: `https://thesvg.org`

| Endpoint | Description |
|----------|-------------|
| `GET /api/registry.json` | Full icon manifest (slug, title, aliases, categories, hex, url, variant keys) |
| `GET /api/categories.json` | Category list with counts |
| `GET /icons/{slug}/{variant}.svg` | Raw SVG file (e.g. `/icons/openai/default.svg`) |

```bash
# Fetch the manifest once, filter client-side
curl "https://thesvg.org/api/registry.json" | jq '.icons[] | select(.slug | contains("openai"))'

# Then pull the SVG you want
curl "https://thesvg.org/icons/openai/default.svg"
```

### Mirrors

For high-traffic apps, use jsDelivr (free, GitHub-backed) instead of hitting `thesvg.org` directly:

```
https://cdn.jsdelivr.net/gh/glincker/thesvg@main/src/data/icons.json
https://cdn.jsdelivr.net/gh/glincker/thesvg@main/public/icons/{slug}/{variant}.svg
```

`src/data/icons.json` is the source-of-truth manifest (the same data that builds `/api/registry.json`, with full per-icon fields including `license` and `dateAdded`).

You can also clone the repo (~30 MB) and self-host. The codebase is MIT-licensed; individual brand icons remain trademarks of their respective owners (see [LEGAL.md](./LEGAL.md)).

> A gated, token-based API is on the roadmap at `api.thesvg.org` for advanced features (search relevance, usage analytics, webhooks). Until then, the static manifest above is the supported integration path.
