---
"thesvg": patch
---

Consolidate and XSS-harden JSON-LD structured data

All seven pages that emit JSON-LD now use a single `JsonLd` server component
that escapes `<` to `<`, so a brand name or description can never break
out of the `<script>` tag. This dedups seven copies of the inline script and
closes a latent injection gap. (Note: this does not change where the JSON-LD is
delivered; see PR notes.)
