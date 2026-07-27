# Plan: GitHub Actions CI + CD

Companion technical design for `spec.md`. Describes the two workflow files, their triggers, jobs, and third-party actions used.

## Target file layout

```
.github/workflows/
  ci.yml        # lint + test + build, gates PRs to main
  deploy.yml    # build + publish to gh-pages on push to main;
                # auto-create GitHub Release on version tag push
```

## `ci.yml`

```yaml
name: CI

on:
  pull_request:
    branches: [main]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm test
      - run: npm run build
```

- Single job, sequential steps — matches the "gates PRs" requirement without needing to share build artifacts across jobs.
- `npm test` runs Jest in default (non-watch) CI mode; no extra flags needed since `dev-test` (the watch variant) is a separate script.
- `npm run build` is included in CI (not just deploy) so a build regression fails the PR check even before merge.

## `deploy.yml`

```yaml
name: Deploy

on:
  push:
    branches: [main]
    tags: ['v*.*.*']

permissions:
  contents: write

jobs:
  deploy:
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: npm
      - run: npm ci
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./out
          # peaceiris/actions-gh-pages writes .nojekyll into the publish
          # branch automatically, so the local `predeploy` echo step is
          # not needed here.

  release:
    if: startsWith(github.ref, 'refs/tags/v')
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4
      - uses: softprops/action-gh-release@v2
        with:
          generate_release_notes: true
```

Two independent jobs in one workflow file, gated by `if:` conditions on `github.ref`, since a `push` trigger fires for both branch pushes and tag pushes but each job should only run for its matching ref type.

### Why one workflow file (not two)
Both `deploy` and `release` share the same `push` trigger surface (main branch pushes vs. tag pushes) and are conceptually "what happens after code ships." Keeping them in one `deploy.yml` avoids duplicating the `on: push:` trigger block; the `if:` guards keep the jobs mutually exclusive per run.

## Actions used and why
- `actions/checkout@v4`, `actions/setup-node@v4` — standard, already the de facto default for Node projects; `setup-node`'s `cache: npm` speeds up `npm ci` using the existing `package-lock.json`.
- `peaceiris/actions-gh-pages@v4` — widely used, handles `.nojekyll`, branch creation/force-push to `gh-pages`, and commit authorship automatically; avoids reimplementing what `gh-pages` (the npm package) does today, but from Actions instead of a local machine.
- `softprops/action-gh-release@v2` — creates a GitHub Release from the current tag with `generate_release_notes: true` (uses GitHub's auto-generated notes from merged PRs/commits since the last tag), removing the manual "Create a release" README step.

## Permissions
- `deploy` job needs `contents: write` to push to the `gh-pages` branch.
- `release` job needs `contents: write` to create a release.
- Both rely solely on the default `GITHUB_TOKEN` — no new repository secrets to configure.

## Node version note
`package.json`'s `@types/node` is pinned to `20.x`, but the maintainer's local dev environment is Node 22. Per user decision, workflows pin Node **22.x**. This is a type-only mismatch (dev-time type defs vs. runtime version) and does not affect the static-export build; revisiting the `@types/node` pin is out of scope for this feature.

## README updates
Update the "Deploying" section to reflect:
1. Bump version (`npm version <newversion>`) — **still manual**.
2. Push branch + tags (`git push && git push --tags`) — **still manual**.
3. Merge to `main` (via PR, gated by CI) — build + publish to `gh-pages` — **now automatic** (was step 2/4).
4. GitHub Release creation — **now automatic**, triggered by the tag push — **now automatic** (was step 6).
5. Verify deployment at the live URL — still a manual sanity check, now just a verification step rather than a trigger.

## Rollout / risk mitigation
1. Land `ci.yml` first in a PR — validates itself (the PR triggers the workflow it adds).
2. Land `deploy.yml` in a follow-up/same PR; first push to `main` after merge will immediately trigger a real deploy — verify the `gh-pages` branch updates as expected and the live site still loads afterward.
3. Test the `release` job by pushing a real version tag (next scheduled release) rather than a synthetic one, to avoid noise in release history.
4. Keep the local `npm run deploy` path available as a manual fallback in case the Actions deploy needs to be bypassed temporarily.
