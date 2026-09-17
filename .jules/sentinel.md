## 2025-02-14 - Replace Regex SVG Sanitization with DOMParser and Fix Quote Escaping
**Vulnerability:** Regex-based sanitization in `sanitizeSvgForRender` was vulnerable to XSS bypasses, and syntax highlight escaping `esc()` did not escape quotes (`"` and `'`), potentially allowing attribute injection.
**Learning:** `dangerouslySetInnerHTML` on user input is a huge risk. Regex cannot safely parse HTML/SVG trees; `DOMParser` is robust.
**Prevention:** Rely on DOM parsing logic (`DOMParser`) to walk and strip dangerous elements (`<script>`, `<foreignObject>`, `on*` events, `javascript:` hrefs) rather than regex string replacement. Ensure text encoding routines escape `"` and `'`.
## 2024-05-24 - DOM-based HTML Escaping Failed to Encode Quotes
**Vulnerability:** XSS vulnerability in `escapeHtml` located in `extensions/figma/src/ui.ts` due to relying on DOM `.innerHTML` to escape characters, which fails to escape single and double quotes.
**Learning:** Browsers do not escape single (`'`) or double (`"`) quotes when reading `.innerHTML` after assigning `.textContent`. If this "escaped" string is placed inside an HTML attribute (like `<button title="${escapeHtml(input)}">`), it can break out and cause XSS.
**Prevention:** Always use regex replacements or a robust library to escape HTML entities (`&`, `<`, `>`, `"`, `'`) for user input, especially when the output will be embedded within HTML attributes.

## 2025-02-14 - XSS in Markdown rendering logic
**Vulnerability:** The Markdown rendering logic in `src/app/blog/[slug]/page.tsx` directly used user input for HTML string formatting without HTML-escaping characters, allowing both raw HTML execution and `javascript:` protocol link injections.
**Learning:** Custom markdown parsers that rely on string `.replace` and pass the output directly into `dangerouslySetInnerHTML` are highly susceptible to XSS if not carefully escaped at the correct step, particularly against attributes like `href`.
**Prevention:** Always use a robust HTML-escaping utility before converting markdown tokens to HTML elements, and strictly block or filter unsafe protocols like `javascript:` when formatting user-provided URLs in `href` attributes.
## 2026-09-16 - Sentinel Character Injection in Regex-based Syntax Highlighter
**Vulnerability:** The `esc()` function in `src/components/icons/shared/syntax-highlight.tsx` failed to strip internal sentinel characters (`` and ``) before they were used as placeholders in regex replacements for syntax highlighting.
**Learning:** When using internal sentinel characters for multi-pass string replacements, they must be stripped from the original user input first. Otherwise, an attacker can submit an SVG containing these characters, bypassing the intended markup structure and injecting arbitrary HTML/JavaScript (XSS) when the highlighted code is rendered.
**Prevention:** Always strip custom sentinel markers from the input before any regex substitution logic begins. Better yet, avoid replacing string tags into `dangerouslySetInnerHTML` if possible, favoring a safer AST-based rendering approach.
