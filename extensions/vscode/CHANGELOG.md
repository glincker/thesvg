# Changelog

## 0.1.1

- Switch icon registry to `thesvg.org/api/registry.json` (post Cloudflare migration)
- Fetch SVG content from `thesvg.org/icons/...` instead of jsDelivr for faster first paint
- Keep jsDelivr URL for the "Copy CDN Link" action
- Variant picker now surfaces the destination URL
- Action picker re-opens after choosing a variant so the flow completes in one pass

## 0.1.0

- Initial release
- Search, copy SVG, copy as JSX, copy CDN link, insert at cursor
- Variant support (default, mono, light, dark, wordmark, etc.)
