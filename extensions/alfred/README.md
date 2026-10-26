# theSVG Alfred Workflow

Search and copy brand SVGs, plus a growing set of UI icons, from [thesvg.org](https://thesvg.org) directly from Alfred 5.

## Install

**Option A: Download (recommended)**

1. Download `thesvg.alfredworkflow` from the [GitHub Releases page](https://github.com/glincker/thesvg/releases).
2. Double-click the file. Alfred will import it automatically.

**Option B: Build from source**

```bash
git clone https://github.com/glincker/thesvg.git
cd thesvg/extensions/alfred
bash build.sh
open thesvg.alfredworkflow
```

## Requirements

- Alfred 5 with a Powerpack license
- macOS (Python 3 is included with macOS 12+)
- Internet access (registry is cached for 6 hours)

## Usage

Type `tsvg` followed by a brand name:

```
tsvg stripe
tsvg github
tsvg aws
```

| Key | Action |
|-----|--------|
| Enter | Copy raw SVG to clipboard |
| Cmd+Enter | Copy CDN URL to clipboard |
| Alt+Enter | Copy markdown image syntax to clipboard |

### UI icons

Type `ui` followed by a name to search UI icons:

```
ui bell
ui bell fill
```

Enter copies the `outline` look. Press Tab on a result (or type the look after the
name) to pick another look: outline, glass, duotone, offset, fill, pixel or depth.
Cmd+Enter and Alt+Enter work the same as for brand icons. UI icons use
`currentColor`, so the copied SVG takes the color of the surrounding text.

The UI index is loaded on first use. If it cannot be fetched you get a one-line
message in the result list and brand search is unaffected.

### Example output

**Enter** copies:
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">...</svg>
```

**Cmd+Enter** copies:
```
https://cdn.jsdelivr.net/gh/glincker/thesvg@main/public/icons/stripe/default.svg
```

**Alt+Enter** copies:
```markdown
![Stripe](https://cdn.jsdelivr.net/gh/glincker/thesvg@main/public/icons/stripe/default.svg)
```

## Cache

The icon registry is cached at:
```
~/Library/Caches/com.glincker.thesvg-alfred/registry.json
```

TTL is 6 hours. Delete the file to force a refresh. The UI icon index is cached
next to it as `ui-icons.json` with the same TTL.

## Screenshot

<!-- Screenshot placeholder: add thesvg-alfred-screenshot.png here -->

## Files

| File | Purpose |
|------|---------|
| `thesvg_search.py` | Alfred Script Filter - searches registry, returns JSON results |
| `thesvg_ui.py` | Alfred Script Filter for UI icons - separate index, look selection |
| `thesvg_action.py` | Action handler - fetches SVG and copies to clipboard via pbcopy |
| `info.plist` | Alfred 5 workflow manifest |
| `icon.png` | Workflow icon (128x128) |
| `build.sh` | Packages the folder into thesvg.alfredworkflow |

## Contributing

Open an issue or PR at [github.com/glincker/thesvg](https://github.com/glincker/thesvg).

## Community

Questions or ideas? Join the [GLINR Discord](https://discord.gg/Ar5pcaZB99).
