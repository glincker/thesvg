---
"@thesvg/cli": minor
"@thesvg/mcp-server": minor
---

Add UI icon support. The CLI gains `add ui:<slug> [--look <look>]`, `list --ui` and `search --ui`. The MCP server gains an optional `kind` parameter (`brand` by default, or `ui`) and a `look` parameter. Existing calls behave exactly as before.
