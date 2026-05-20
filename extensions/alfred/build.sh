#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
rm -f thesvg.alfredworkflow
zip -r thesvg.alfredworkflow info.plist icon.png thesvg_search.py thesvg_action.py
echo "Built thesvg.alfredworkflow"
