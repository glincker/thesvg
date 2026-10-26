#!/usr/bin/env python3
"""
thesvg_ui.py - Alfred 5 Script Filter for theSVG UI icons

Searches the separate UI icon index (never merged with the brand index).
Enter on a result copies the outline look; Tab then lists every look for
that icon (or type the look after the slug, e.g. "bell fill").

Usage (from Alfred Script Filter):
    python3 thesvg_ui.py "{query}"
"""

import json
import os
import sys
import time
import urllib.error
import urllib.request
from typing import Any

CDN = "https://cdn.jsdelivr.net/gh/glincker/thesvg@main"
UI_INDEX_URL = f"{CDN}/src/data/ui-icons.json"
CACHE_DIR = os.path.expanduser("~/Library/Caches/com.glincker.thesvg-alfred")
CACHE_FILE = os.path.join(CACHE_DIR, "ui-icons.json")
CACHE_TTL_SECONDS = 6 * 60 * 60
MAX_RESULTS = 20
DEFAULT_LOOKS = ["outline", "glass", "duotone", "offset", "fill", "pixel", "depth"]
DEFAULT_LOOK = "outline"


def ui_svg_url(slug: str, look: str) -> str:
    # The per-icon files are served by the site, not committed to the repo.
    return f"https://thesvg.org/ui/{slug}/{look}.svg"


def _read_cache() -> dict[str, Any] | None:
    try:
        with open(CACHE_FILE, encoding="utf-8") as fh:
            data = json.load(fh)
        return data if isinstance(data, dict) else None
    except (json.JSONDecodeError, OSError):
        return None


def load_ui_index() -> dict[str, Any]:
    """Return the UI index from cache or remote; raise RuntimeError softly."""
    if os.path.exists(CACHE_FILE):
        if time.time() - os.path.getmtime(CACHE_FILE) < CACHE_TTL_SECONDS:
            cached = _read_cache()
            if cached is not None:
                return cached

    try:
        req = urllib.request.Request(
            UI_INDEX_URL, headers={"User-Agent": "thesvg-alfred/1.0"}
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            raw = resp.read()
        data = json.loads(raw)
        if not isinstance(data, dict) or not isinstance(data.get("icons"), list):
            raise ValueError("unexpected shape")
        os.makedirs(CACHE_DIR, exist_ok=True)
        with open(CACHE_FILE, "wb") as fh:
            fh.write(raw)
        return data
    except urllib.error.HTTPError as exc:
        # A 404 means the UI set is not published yet; a stale cache still helps.
        stale = _read_cache()
        if stale is not None:
            return stale
        if exc.code == 404:
            raise RuntimeError("UI icons are not available yet") from exc
        raise RuntimeError(f"Could not load UI icons (HTTP {exc.code})") from exc
    except (urllib.error.URLError, OSError, ValueError, TimeoutError) as exc:
        stale = _read_cache()
        if stale is not None:
            return stale
        raise RuntimeError("Could not load UI icons (offline?)") from exc


def search(icons: list[dict[str, Any]], query: str) -> list[dict[str, Any]]:
    """Prefix matches on title/slug/tags first, then substring, then by title."""
    q = query.strip().lower()
    if not q:
        return icons[:MAX_RESULTS]

    prefix: list[dict[str, Any]] = []
    sub: list[dict[str, Any]] = []
    for icon in icons:
        fields = [icon.get("title", "").lower(), icon.get("slug", "").lower()]
        fields += [str(t).lower() for t in icon.get("tags", [])]
        if any(f.startswith(q) for f in fields):
            prefix.append(icon)
        elif any(q in f for f in fields) or q in icon.get("category", "").lower():
            sub.append(icon)

    prefix.sort(key=lambda x: x.get("title", "").lower())
    sub.sort(key=lambda x: x.get("title", "").lower())
    return (prefix + sub)[:MAX_RESULTS]


def _mods(slug: str, look: str) -> dict[str, Any]:
    return {
        "cmd": {
            "arg": f"ui:{slug}|{look}|url",
            "subtitle": "Copy CDN URL",
            "valid": True,
        },
        "alt": {
            "arg": f"ui:{slug}|{look}|md",
            "subtitle": "Copy markdown image syntax",
            "valid": True,
        },
    }


def build_item(icon: dict[str, Any], look: str = DEFAULT_LOOK) -> dict[str, Any]:
    slug = icon.get("slug", "")
    title = icon.get("title", slug)
    url = ui_svg_url(slug, look)
    return {
        "uid": f"ui-{slug}",
        "title": title,
        "subtitle": f"{icon.get('category', '')} | Enter: {look} | Tab: choose look",
        "arg": f"ui:{slug}|{look}",
        "autocomplete": f"{slug} ",
        "icon": {"path": "./icon.png"},
        "mods": _mods(slug, look),
        "text": {"copy": url, "largetype": title},
        "quicklookurl": url,
    }


def build_look_items(
    icon: dict[str, Any], looks: list[str], prefix: str
) -> list[dict[str, Any]]:
    slug = icon.get("slug", "")
    title = icon.get("title", slug)
    items = []
    for look in looks:
        if prefix and not look.startswith(prefix):
            continue
        url = ui_svg_url(slug, look)
        items.append(
            {
                "uid": f"ui-{slug}-{look}",
                "title": f"{title} ({look})",
                "subtitle": "Enter: copy SVG",
                "arg": f"ui:{slug}|{look}",
                "autocomplete": f"{slug} {look}",
                "icon": {"path": "./icon.png"},
                "mods": _mods(slug, look),
                "text": {"copy": url, "largetype": title},
                "quicklookurl": url,
            }
        )
    return items


def message_item(title: str, subtitle: str) -> dict[str, Any]:
    return {
        "uid": "ui-message",
        "title": title,
        "subtitle": subtitle,
        "arg": "",
        "valid": False,
        "icon": {"path": "./icon.png"},
    }


def respond(query: str, index: dict[str, Any]) -> dict[str, Any]:
    icons: list[dict[str, Any]] = index.get("icons", [])
    looks: list[str] = index.get("looks") or DEFAULT_LOOKS
    by_slug = {i.get("slug"): i for i in icons}

    # "<slug> <look-prefix>" is the second step: choose a look.
    head, _, tail = query.lstrip().partition(" ")
    icon = by_slug.get(head.lower())
    if icon is not None and (tail or query.endswith(" ")):
        items = build_look_items(icon, looks, tail.strip().lower())
        if items:
            return {"items": items}

    results = search(icons, query)
    if not results:
        text = f'No UI icons for "{query}"' if query else "Type to search UI icons"
        return {"items": [message_item("No UI icons found", text)]}
    return {"items": [build_item(i) for i in results]}


def main() -> None:
    query = sys.argv[1] if len(sys.argv) > 1 else ""
    try:
        index = load_ui_index()
    except RuntimeError as exc:
        print(json.dumps({"items": [message_item("theSVG UI icons", str(exc))]}))
        return
    print(json.dumps(respond(query, index)))


if __name__ == "__main__":
    main()
