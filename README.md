This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

To run this project locally, ensure you have [Node.js](https://nodejs.org/) installed.

### 1. Install dependencies

```bash
npm install
```

### 2. Start the development server

```bash
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

### 3. Start developing

You can begin editing by modifying `app/page.tsx`. The page will automatically reload as you save your changes.

This project uses **Next.js** with **TypeScript** for type safety and modern development features.

## Future features

You can see our future features at our issues page: [Issues](https://github.com/loewesolucoes/gestao-financeira/issues)

## Deploying

Deployment and release creation are automated via GitHub Actions (see `.github/workflows/deploy.yml`). To ship a new version, follow these steps:

1. **Update the npm version on your feature branch, without tagging yet**  
   Bump the version number, but skip the local git tag for now (we'll create it on `main` after the merge, so the generated release notes can include the merged PRs — see the note below):

```bash
npm version <newversion> --no-git-tag-version
git add package.json package-lock.json
git commit -m "chore: bump version to <newversion>"
git push
```

2. **Open/merge the PR into `main`**  
   Once CI passes and the PR is merged, `main` now contains the version bump.

3. **Automatic build & deploy**  
   Merging to `main` triggers the `deploy` workflow, which builds the app and publishes the static output to the [gh-pages branch](https://github.com/loewesolucoes/gestao-financeira/tree/gh-pages) automatically — no manual build/deploy step is needed.

4. **Verify the deployment**  
   Visit [https://loewesolucoes.github.io/gestao-financeira/](https://loewesolucoes.github.io/gestao-financeira/) to confirm your app is live.

5. **Tag `main` (after the merge) and push the tag**  
   Checkout and pull the latest `main`, then create and push the tag pointing at the merge commit:

```bash
git checkout main
git pull
git tag vX.Y.Z
git push origin vX.Y.Z
```

> ⚠️ **Tag `main` after merging, not your feature branch before merging!** `npm version` creates the `vX.Y.Z` tag **locally only** — a plain `git push` never pushes it, so always push it explicitly (`git push origin vX.Y.Z` or `git push --tags`). More importantly: if you tag your feature branch *before* it's merged, the tag's commit is an *ancestor* of the `Merge pull request #NN` commit on `main`, not a descendant of it — so GitHub's auto-generated release notes (`generate_release_notes: true`) can't see that PR and will only produce a bare "Full Changelog" compare link instead of a proper "What's Changed" list. Tagging `main` after the merge fixes this.

6. **Automatic GitHub Release**  
   Pushing the `vX.Y.Z` tag triggers the `release` workflow, which creates a GitHub Release with auto-generated notes (a "What's Changed" list of merged PRs, same as GitHub's UI "Generate release notes" button) — no manual release step is needed.

### Manual fallback

If you need to deploy locally instead of relying on the Actions workflow, you can still run:

```bash
npm run build
npm run deploy
```

This builds the static site to `out/` and publishes it to `gh-pages` directly.

## Testing

- **Unit/component tests** (Jest + React Testing Library, colocated under `__tests__/` folders): `npm test` (or `npm run dev-test` to watch).
- **E2E smoke tests** (Playwright): `npm run test:e2e`. Unlike `npm test`, this runs against the **production static export** (`out/`, built via `npm run build`) served with the real `/gestao-financeira` basePath, rather than `next dev` — so it also catches static-export/basePath-only regressions. It navigates the app's main routes and asserts each renders without an unhandled error, shows its expected content, and finishes client-side DB initialization.
  - One-time setup: `npx playwright install --with-deps chromium`.
  - Run a single spec: `npx playwright test e2e/smoke/caixa.spec.ts`.
  - Because it builds the app first, `test:e2e` takes noticeably longer than `npm test`.

## Continuous Integration

Every pull request targeting `main` runs the `ci.yml` workflow: the `build-and-test` job (`npm ci` → `npm run lint` → `npm test` → `npm run build`) and a separate `e2e` job (`npm ci` → install Playwright's Chromium → `npm run test:e2e`), both on Node 22.


`main` is protected by a repository ruleset that requires the `build-and-test` check to pass before a PR can be merged (merging without a passing pipeline is blocked). If a PR shows **"Merging is blocked"** even though checks are green, check for a stale/pending required reviewer (e.g. an automatic Copilot code review request left over from a rule change) — removing it or re-requesting the review usually clears the block.

### Required repository secrets

The build step in both `ci.yml` and `deploy.yml` needs the following **GitHub Actions secrets** configured under **Settings → Secrets and variables → Actions → Secrets** (these back the Google Drive OAuth integration and are consumed as `NEXT_PUBLIC_*` env vars, which Next.js inlines at build time):

- `NEXT_PUBLIC_API_KEY`
- `NEXT_PUBLIC_CLIENT_ID`

The other `NEXT_PUBLIC_*` vars (`TITLE`, `DESCRIPTION`, `URL`, `IMAGE`, `CREATOR`) are non-sensitive and already committed in the tracked `.env` file, so no extra secret configuration is needed for those.

If the `Deploy to GitHub Pages` step fails to push to `gh-pages` with a permissions error, check **Settings → Actions → General → Workflow permissions** — it must allow **"Read and write permissions"** for the built-in `GITHUB_TOKEN` used by `peaceiris/actions-gh-pages`. If that setting is locked/enforced at the organization level and can't be changed, use a fine-grained Personal Access Token (Contents: Read and write, scoped to this repo) stored as a secret and referenced in the deploy step instead of `secrets.GITHUB_TOKEN`.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!
