## 2025-02-14 - Replace Regex SVG Sanitization with DOMParser and Fix Quote Escaping
**Vulnerability:** Regex-based sanitization in `sanitizeSvgForRender` was vulnerable to XSS bypasses, and syntax highlight escaping `esc()` did not escape quotes (`"` and `'`), potentially allowing attribute injection.
**Learning:** `dangerouslySetInnerHTML` on user input is a huge risk. Regex cannot safely parse HTML/SVG trees; `DOMParser` is robust.
**Prevention:** Rely on DOM parsing logic (`DOMParser`) to walk and strip dangerous elements (`<script>`, `<foreignObject>`, `on*` events, `javascript:` hrefs) rather than regex string replacement. Ensure text encoding routines escape `"` and `'`.
