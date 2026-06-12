# Publishing thesvg VS Code Extension

This document covers publishing to both the official VS Code Marketplace and the Open VSX Registry.

## Registries

| Registry | URL | Used by |
|---|---|---|
| VS Code Marketplace | marketplace.visualstudio.com | VS Code, VS Code Insiders |
| Open VSX Registry | open-vsx.org | Cursor, Windsurf, VSCodium, Gitpod, Theia, Eclipse Che |

Publishing to Open VSX gives thesvg reach across the entire AI-IDE ecosystem outside of Microsoft's marketplace. Cursor and Windsurf in particular have large developer audiences who will never see a marketplace-only extension.

---

## VS Code Marketplace (already live)

Uses `@vscode/vsce` and the `VSCE_PAT` secret. CI auto-publishes on version bumps via `.github/workflows/vscode-release.yml`.

Manual publish:

```bash
cd extensions/vscode
VSCE_PAT=<your-pat> npm run publish
```

---

## Open VSX Registry

### 1. Create an account

Go to [open-vsx.org](https://open-vsx.org) and sign in with GitHub.

### 2. Create a namespace (one-time)

The namespace must match the `publisher` field in `package.json` (currently `glincker`).

```bash
npx ovsx create-namespace glincker -p $OVSX_PAT
```

This only needs to be done once. The namespace ties the publisher name to your Open VSX account.

### 3. Generate an access token

In your Open VSX user settings (open-vsx.org/user-settings/tokens), create a token with publish permissions. Store it as `OVSX_PAT` in your environment or as a GitHub Actions secret named `OVSX_PAT`.

### 4. Package the extension

Make sure you have a fresh `.vsix` built from the current version:

```bash
cd extensions/vscode
npm run package
# produces thesvg-<version>.vsix
```

### 5. Publish to Open VSX

```bash
cd extensions/vscode
OVSX_PAT=<your-token> npm run publish:ovsx
```

This runs `ovsx publish -p $OVSX_PAT`, which picks up the most recently packaged `.vsix` automatically.

### 6. Verify publication

Visit `https://open-vsx.org/extension/glincker/thesvg` after publishing. It may take a few minutes to index.

---

## CI/CD: Adding Open VSX to the release workflow

The existing `.github/workflows/vscode-release.yml` publishes to the VS Code Marketplace. To mirror it for Open VSX, add a second publish step (or a parallel job) after the marketplace publish step. The `OVSX_PAT` secret must be added to the repository's Actions secrets first.

```yaml
# Add to .github/workflows/vscode-release.yml
# after the existing "Publish to Marketplace" step:

      - name: Publish to Open VSX
        if: steps.version.outputs.bumped == 'true'
        working-directory: extensions/vscode
        env:
          OVSX_PAT: ${{ secrets.OVSX_PAT }}
        run: npx ovsx publish -p $OVSX_PAT

# Or as a separate parallel job that also depends on the version bump check:
#
# publish-ovsx:
#   name: Publish to Open VSX
#   runs-on: ubuntu-latest
#   needs: publish          # depends on the existing marketplace job
#   steps:
#     - uses: actions/checkout@v6
#     - uses: actions/setup-node@v6
#       with:
#         node-version: '20'
#         cache: 'npm'
#         cache-dependency-path: extensions/vscode/package-lock.json
#     - name: Install dependencies
#       working-directory: extensions/vscode
#       run: npm ci
#     - name: Package
#       working-directory: extensions/vscode
#       run: npm run package
#     - name: Publish to Open VSX
#       working-directory: extensions/vscode
#       env:
#         OVSX_PAT: ${{ secrets.OVSX_PAT }}
#       run: npx ovsx publish -p $OVSX_PAT
```

---

## Quick reference

```bash
# First-time namespace setup
npx ovsx create-namespace glincker -p $OVSX_PAT

# Verify your token works
npx ovsx verify-pat glincker -p $OVSX_PAT

# Package + publish in one go
npm run package && OVSX_PAT=<token> npm run publish:ovsx

# Check published versions
npx ovsx get glincker.thesvg
```
