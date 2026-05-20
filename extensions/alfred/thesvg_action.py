#!/usr/bin/env python3
"""
thesvg_action.py - Alfred 5 action handler for theSVG

Reads the arg passed from the Script Filter (format: <slug>|<variant>
or <slug>|<variant>|<mode>), fetches the SVG via urllib, and writes
the result to the macOS clipboard via pbcopy.

Modes:
    (none)   - Copy raw SVG body
    url      - Copy CDN URL only
    md       - Copy markdown image syntax

Usage (from Alfred Run Script):
    python3 thesvg_action.py "{query}"
"""

import subprocess
import sys
import urllib.error
import urllib.request

CDN_BASE = "https://cdn.jsdelivr.net/gh/glincker/thesvg@main/public/icons"


def cdn_url(slug: str, variant: str = "default") -> str:
    return f"{CDN_BASE}/{slug}/{variant}.svg"


def fetch_svg(url: str) -> str:
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "thesvg-alfred/1.0"},
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        return resp.read().decode("utf-8")


def copy_to_clipboard(text: str) -> None:
    proc = subprocess.run(
        ["pbcopy"],
        input=text.encode("utf-8"),
        check=True,
    )
    _ = proc  # silence unused-variable warning


def main() -> None:
    raw_arg = sys.argv[1].strip() if len(sys.argv) > 1 else ""

    if not raw_arg:
        sys.stderr.write("thesvg_action: no arg provided\n")
        sys.exit(1)

    parts = raw_arg.split("|")
    slug = parts[0] if len(parts) > 0 else ""
    variant = parts[1] if len(parts) > 1 else "default"
    mode = parts[2] if len(parts) > 2 else ""

    if not slug:
        sys.stderr.write("thesvg_action: empty slug\n")
        sys.exit(1)

    url = cdn_url(slug, variant)

    try:
        if mode == "url":
            copy_to_clipboard(url)
            print(f"Copied CDN URL for {slug}")
        elif mode == "md":
            # Derive a display title from slug (capitalize, replace hyphens)
            title = slug.replace("-", " ").title()
            md_text = f"![{title}]({url})"
            copy_to_clipboard(md_text)
            print(f"Copied markdown for {slug}")
        else:
            svg_body = fetch_svg(url)
            copy_to_clipboard(svg_body)
            print(f"Copied SVG for {slug} ({variant})")
    except urllib.error.URLError as exc:
        sys.stderr.write(f"thesvg_action: network error: {exc}\n")
        sys.exit(1)
    except subprocess.CalledProcessError as exc:
        sys.stderr.write(f"thesvg_action: pbcopy failed: {exc}\n")
        sys.exit(1)


if __name__ == "__main__":
    main()
