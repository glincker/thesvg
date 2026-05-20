# thesvg Homebrew Tap

Install the thesvg CLI via [Homebrew](https://brew.sh).

```sh
brew tap glincker/thesvg
brew install thesvg
```

Then use it:

```sh
thesvg add github
thesvg add --format react stripe
```

## Maintenance

The formula is kept in sync by the `homebrew-tap-update` workflow in this repo.
It fires on each published release and pushes an updated formula to
[glincker/homebrew-thesvg](https://github.com/glincker/homebrew-thesvg).

Before the workflow can run, a repository maintainer must:

1. Create the tap repo at `github.com/glincker/homebrew-thesvg`.
2. Add a fine-grained PAT with `contents: write` on that repo as the
   `HOMEBREW_TAP_TOKEN` secret in the main repo settings.
