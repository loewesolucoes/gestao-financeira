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

1. **Update the npm version**  
   Bump the version number as appropriate (major, minor, patch, or specify a version):

```bash
npm version <newversion>
```

2. **Push changes and tags to GitHub**  
   Make sure your changes and version tags are pushed to `main`:

```bash
git push
git push --tags
```

3. **Automatic build & deploy**  
   Merging to `main` triggers the `deploy` workflow, which builds the app and publishes the static output to the [gh-pages branch](https://github.com/loewesolucoes/gestao-financeira/tree/gh-pages) automatically — no manual build/deploy step is needed.

4. **Verify the deployment**  
   Visit [https://loewesolucoes.github.io/gestao-financeira/](https://loewesolucoes.github.io/gestao-financeira/) to confirm your app is live.

5. **Automatic GitHub Release**  
   Pushing the `vX.Y.Z` tag triggers the `release` workflow, which creates a GitHub Release with generated release notes automatically — no manual release step is needed.

### Manual fallback

If you need to deploy locally instead of relying on the Actions workflow, you can still run:

```bash
npm run build
npm run deploy
```

This builds the static site to `out/` and publishes it to `gh-pages` directly.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!
