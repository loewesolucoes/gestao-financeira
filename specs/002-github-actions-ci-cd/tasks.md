# Tasks: GitHub Actions CI + CD

Checklist for implementing `spec.md` / `plan.md`. Work top to bottom; each task should be a small, reviewable commit.

- [ ] **T1 — Add `.github/workflows/ci.yml`**
  - Trigger: `pull_request` targeting `main` only (no `push` trigger).
  - Steps: checkout, `actions/setup-node@v4` (Node 22, `cache: npm`), `npm ci`, `npm run lint`, `npm test`, `npm run build`.

- [ ] **T2 — Add `.github/workflows/deploy.yml`**
  - `deploy` job: trigger on `push` to `main` (guarded with `if: github.ref == 'refs/heads/main'`); checkout, setup-node (22), `npm ci`, `npm run build`, publish `out/` to `gh-pages` via `peaceiris/actions-gh-pages@v4` using `secrets.GITHUB_TOKEN`.
  - `release` job: trigger on `push` of tag `v*.*.*` (guarded with `if: startsWith(github.ref, 'refs/tags/v')`); checkout, `softprops/action-gh-release@v2` with `generate_release_notes: true`.
  - Set `permissions: contents: write` at workflow (or job) level for both jobs.

- [ ] **T3 — Validate CI workflow**
  - Open a PR touching a trivial file (or this spec) to confirm `ci.yml` runs and passes (lint/test/build all green).
  - Intentionally break lint/test locally-only (not committed) to sanity-check the workflow would fail — or verify by reading logs of a deliberately-failing throwaway branch/PR if feasible.

- [ ] **T4 — Validate deploy workflow**
  - Merge a PR to `main` and confirm the `deploy` job runs, `gh-pages` branch updates with fresh content, and https://loewesolucoes.github.io/gestao-financeira/ reflects the change.
  - Confirm `.nojekyll` is present on the `gh-pages` branch after the Action runs (via `peaceiris/actions-gh-pages`, no manual step needed).

- [ ] **T5 — Validate release workflow**
  - On the next real version bump, push the resulting `vX.Y.Z` tag and confirm a GitHub Release is auto-created with generated notes, without a manual "Create a release" step.

- [ ] **T6 — Update README's "Deploying" section**
  - Mark steps 4 (deploy) and 6 (create release) as automatic, triggered by merging to `main` / pushing a tag, respectively.
  - Keep steps 1–3 (bump version, build locally optional, push branch + tags) as the remaining manual steps; clarify local `npm run build`/`npm run deploy` remain available as a manual fallback.

## Out of scope (future follow-ups, not part of this work)
- Configuring branch protection / required status checks referencing the new `ci.yml` job.
- Adding a CI trigger for the `develop` branch.
- Switching GitHub Pages from the `gh-pages` branch to the native Actions-artifact deploy mode.
- Removing the `gh-pages` npm package / `npm run deploy` script.
