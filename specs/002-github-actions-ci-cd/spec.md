# Spec: GitHub Actions CI + CD

## Status
`Draft` — not yet started. Captured from a design discussion on 2026-07-26.

## Problem statement
The project has no GitHub Actions workflows. Nothing gates pull requests: a PR can be merged into `main` without lint, tests, or a successful build ever running. Deployment is also fully manual, per the README checklist: bump version with `npm version`, run `npm run build` locally, `git push`/`git push --tags`, then `npm run deploy` (which runs `gh-pages -d out --dotfiles` from the contributor's machine) to publish to the `gh-pages` branch, and finally create a GitHub Release by hand.

### Why this is a problem
- **No merge gate** — broken lint/tests/build can land on `main` without anyone noticing until someone runs the checks locally.
- **Deploy depends on a local machine** — publishing requires a contributor's local Node/npm setup and git credentials; it isn't reproducible or auditable, and nothing guarantees the deployed build matches what's on `main`.
- **Manual, easy-to-forget release steps** — creating the GitHub Release is a separate manual step that can be skipped or done inconsistently.

## Goals
1. Add a CI workflow that runs lint, test, and build for every pull request targeting `main`, so failing checks are visible before merge (and can be wired up as a required status check in branch protection).
2. Add a CD workflow that automatically builds and publishes the static site (`out/`) to the `gh-pages` branch whenever `main` is updated (i.e., on every merge), removing the need to run `npm run deploy` locally.
3. Automatically create a GitHub Release (with generated release notes) whenever a version tag (`v*.*.*`) is pushed, removing the last manual release step.

## Non-goals
- Not changing the static export/deploy target — still `output: 'export'` static files published to the `gh-pages` branch on GitHub Pages.
- Not changing the manual parts of the release process that precede CI/CD: bumping the version with `npm version` and pushing the branch + tag remain manual, contributor-driven steps.
- Not introducing branch protection rules themselves (configuring required status checks in repo settings is a follow-up, not part of this spec).
- Not adding a `develop`-branch CI trigger — only `main` is in scope for both workflows, per project decision.
- Not removing the existing `npm run deploy` / `gh-pages` npm script — it can remain as a manual local fallback.

## Constraints (project-specific)
- App is statically exported (`output: 'export'`) — the deploy workflow must run `npm run build` and publish the resulting `out/` directory, matching exactly what a local `npm run deploy` would produce today.
- Deployment must keep publishing to the `gh-pages` branch (GitHub Pages is configured to serve from that branch) — do not switch to the newer "deploy from Actions artifact" Pages mode as part of this spec.
- CI/CD must use the standard `GITHUB_TOKEN` (no new secrets to provision) for both publishing to `gh-pages` and creating releases.
- Node version used in workflows: **22.x** (the version the maintainer develops with locally), even though `@types/node` currently pins `20.x` in `package.json`.
- ESLint config is `next/core-web-vitals` (`npm run lint`) and tests run via `npm test` (Jest, non-watch) — CI must call these exact existing scripts, not introduce new tooling.

## Acceptance criteria
- [ ] A `pull_request` targeting `main` triggers a CI workflow that runs, in order, `npm ci`, `npm run lint`, `npm test`, `npm run build`, and fails the check if any step fails. No `push` trigger on this workflow.
- [ ] A `push` to `main` (i.e., after a PR merges) triggers a workflow that runs `npm ci` + `npm run build` and publishes `out/` to the `gh-pages` branch automatically, with no local step required.
- [ ] Pushing a tag matching `v*.*.*` triggers a workflow job that creates a GitHub Release for that tag with auto-generated release notes, with no manual "Create a release" step required.
- [ ] Both workflows use Node 22.x and rely only on the default `GITHUB_TOKEN` permissions (no new repository secrets).
- [ ] README's "Deploying" section is updated to reflect which steps are now automatic vs. still manual.
