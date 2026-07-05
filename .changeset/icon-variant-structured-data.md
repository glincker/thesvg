---
"thesvg": patch
---

Enrich per-icon structured data for richer search results

The icon detail page's ImageObject JSON-LD now marks the icon as free
(`isAccessibleForFree`, `representativeOfPage`) and exposes each additional
variant (mono, dark, color, wordmark, ...) as its own `associatedMedia`
ImageObject, so search engines can surface a brand's variants individually.
