## 2024-05-15 - [Precalculate used domains]
**Learning:** Checking for `GLYPHS.some` against every `DOMAIN.id` on each page render is very expensive, especially because the array size makes it O(N*M) time complexity. Using `Array.some` continuously adds unnecessary memory garbage when processing a high volume of domain checking.
**Action:** Always precalculate a Set for lookup when using arrays heavily for UI filters and mapping iterations inside of page generation logic.
