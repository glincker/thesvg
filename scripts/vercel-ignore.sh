#!/bin/bash
# Vercel Ignore Build Step
# Exit 0 = skip build, Exit 1 = proceed with build
# https://vercel.com/docs/projects/overview#ignored-build-step

BRANCH="$VERCEL_GIT_COMMIT_REF"
MESSAGE=$(git log -1 --pretty=%B)

# Always skip: changeset release branches
if [[ "$BRANCH" == "changeset-release/"* ]]; then
  echo ">> Skipping: changeset release branch"
  exit 0
fi

# Always skip: [skip ci] in commit message
if echo "$MESSAGE" | grep -q '\[skip ci\]'; then
  echo ">> Skipping: [skip ci] in commit message"
  exit 0
fi

# Always skip: version package commits from changesets
if echo "$MESSAGE" | grep -q '^chore(release): version packages'; then
  echo ">> Skipping: changesets version commit"
  exit 0
fi

# Always build: main branch
if [[ "$BRANCH" == "main" ]]; then
  echo ">> Building: main branch"
  exit 1
fi

# For other branches: only build if app-relevant files changed
CHANGED=$(git diff HEAD~1 --name-only 2>/dev/null || echo "")

# Skip if only docs, scripts, or config changed
if echo "$CHANGED" | grep -qvE '^(docs-local/|scripts/|\.changeset/|\.github/|CLAUDE\.md|CONTRIBUTING\.md|README\.md|LICENSE)'; then
  echo ">> Building: app files changed on $BRANCH"
  exit 1
fi

echo ">> Skipping: no app files changed on $BRANCH"
exit 0
