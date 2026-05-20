#!/usr/bin/env python3
"""
thesvg_search.py - Alfred 5 Script Filter for theSVG

Reads {query} from argv[1], searches the theSVG registry, and returns
Alfred JSON v2 results to stdout.

Usage (from Alfred Script Filter):
    python3 thesvg_search.py "{query}"
"""

import json
import os
import sys
import time
import urllib.error
import urllib.request
from typing import Any

REGISTRY_URL = (
    "https://cdn.jsdelivr.net/gh/glincker/thesvg@main/src/data/icons.json"
)
CDN_BASE = "https://cdn.jsdelivr.net/gh/glincker/thesvg@main/public/icons"
CACHE_DIR = os.path.expanduser(
    "~/Library/Caches/com.glincker.thesvg-alfred"
)
CACHE_FILE = os.path.join(CACHE_DIR, "registry.json")
CACHE_TTL_SECONDS = 6 * 60 * 60  # 6 hours
MAX_RESULTS = 20


def load_registry() -> list[dict[str, Any]]:
    """Return icon list from cache (if fresh) or remote."""
    os.makedirs(CACHE_DIR, exist_ok=True)

    if os.path.exists(CACHE_FILE):
        age = time.time() - os.path.getmtime(CACHE_FILE)
        if age < CACHE_TTL_SECONDS:
            try:
                with open(CACHE_FILE, encoding="utf-8") as fh:
                    data = json.load(fh)
                return _extract_icons(data)
            except (json.JSONDecodeError, OSError):
                # Corrupt or unreadable cache; fall through to refetch.
                pass

    try:
        req = urllib.request.Request(
            REGISTRY_URL,
            headers={"User-Agent": "thesvg-alfred/1.0"},
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            raw = resp.read()
        data = json.loads(raw)
        # Only persist the cache after a successful parse.
        with open(CACHE_FILE, "wb") as fh:
            fh.write(raw)
        return _extract_icons(data)
    except (urllib.error.URLError, json.JSONDecodeError) as exc:
        # If network fails but a stale cache exists, use it.
        if os.path.exists(CACHE_FILE):
            try:
                with open(CACHE_FILE, encoding="utf-8") as fh:
                    data = json.load(fh)
                return _extract_icons(data)
            except (json.JSONDecodeError, OSError):
                pass
        raise RuntimeError(f"Failed to load registry: {exc}") from exc


def _extract_icons(data: Any) -> list[dict[str, Any]]:
    """Handle both wrapped {icons:[...]} and bare [...] registry shapes."""
    if isinstance(data, list):
        return data
    if isinstance(data, dict):
        for key in ("icons", "data"):
            if key in data and isinstance(data[key], list):
                return data[key]
    return []


def search(icons: list[dict[str, Any]], query: str) -> list[dict[str, Any]]:
    """
    Case-insensitive substring search across title, slug, and aliases.
    Sort order: exact-prefix matches first, then substring, then alphabetical.
    """
    if not query:
        return icons[:MAX_RESULTS]

    q = query.strip().lower()
    exact_prefix: list[dict[str, Any]] = []
    substring: list[dict[str, Any]] = []

    for icon in icons:
        title_lower = icon.get("title", "").lower()
        slug_lower = icon.get("slug", "").lower()
        aliases: list[str] = icon.get("aliases", [])
        alias_lowers = [a.lower() for a in aliases]

        # Check prefix match
        is_prefix = (
            title_lower.startswith(q)
            or slug_lower.startswith(q)
            or any(a.startswith(q) for a in alias_lowers)
        )
        # Check substring match
        is_substring = (
            q in title_lower
            or q in slug_lower
            or any(q in a for a in alias_lowers)
        )

        if is_prefix:
            exact_prefix.append(icon)
        elif is_substring:
            substring.append(icon)

    exact_prefix.sort(key=lambda x: x.get("title", "").lower())
    substring.sort(key=lambda x: x.get("title", "").lower())

    results = exact_prefix + substring
    return results[:MAX_RESULTS]


def icon_cdn_url(slug: str, variant: str = "default") -> str:
    return f"{CDN_BASE}/{slug}/{variant}.svg"


def build_subtitle(icon: dict[str, Any]) -> str:
    parts: list[str] = []
    slug = icon.get("slug", "")
    if slug:
        parts.append(slug)
    hex_val = icon.get("hex", "")
    if hex_val:
        parts.append(f"#{hex_val}")
    categories: list[str] = icon.get("categories", [])
    parts.extend(categories[:3])
    return ", ".join(parts)


def pick_default_variant(icon: dict[str, Any]) -> str:
    """Return the best available variant key for display."""
    variants = icon.get("variants", [])
    if isinstance(variants, list):
        if "default" in variants:
            return "default"
        if variants:
            return variants[0]
    if isinstance(variants, dict):
        if "default" in variants:
            return "default"
        keys = list(variants.keys())
        if keys:
            return keys[0]
    return "default"


def build_alfred_item(icon: dict[str, Any]) -> dict[str, Any]:
    slug = icon.get("slug", "")
    title = icon.get("title", slug)
    variant = pick_default_variant(icon)
    cdn_url = icon_cdn_url(slug, variant)
    subtitle = build_subtitle(icon)

    return {
        "uid": slug,
        "title": title,
        "subtitle": subtitle,
        "arg": f"{slug}|{variant}",
        "autocomplete": title,
        "icon": {"path": "./icon.png"},
        "mods": {
            "cmd": {
                "arg": f"{slug}|{variant}|url",
                "subtitle": "Copy CDN URL",
                "valid": True,
            },
            "alt": {
                "arg": f"{slug}|{variant}|md",
                "subtitle": "Copy markdown image syntax",
                "valid": True,
            },
        },
        "text": {
            "copy": cdn_url,
            "largetype": title,
        },
        "quicklookurl": cdn_url,
    }


def output_error(message: str) -> None:
    result = {
        "items": [
            {
                "uid": "error",
                "title": "theSVG: Error",
                "subtitle": message,
                "arg": "",
                "valid": False,
                "icon": {"path": "./icon.png"},
            }
        ]
    }
    print(json.dumps(result))


def main() -> None:
    query = sys.argv[1].strip() if len(sys.argv) > 1 else ""

    try:
        icons = load_registry()
    except RuntimeError as exc:
        output_error(str(exc))
        return

    results = search(icons, query)

    if not results:
        no_results = {
            "items": [
                {
                    "uid": "no-results",
                    "title": "No icons found",
                    "subtitle": (
                        f'No results for "{query}"' if query
                        else "Type to search 6,030+ brand icons"
                    ),
                    "arg": "",
                    "valid": False,
                    "icon": {"path": "./icon.png"},
                }
            ]
        }
        print(json.dumps(no_results))
        return

    items = [build_alfred_item(icon) for icon in results]
    print(json.dumps({"items": items}))


if __name__ == "__main__":
    main()
