# Copilot Instructions — Gestão Financeira

## Project overview

**What it does (for the user):** Gestão Financeira is a personal budgeting and net-worth tracker. It lets someone record income/expenses month by month (caixa), set and follow savings goals (metas), monitor overall net worth/assets over time (patrimônio), track loans given or taken (empréstimos), view spending/saving reports and charts (relatórios), and keep finance-related notes (notas) — with optional backup to Google Drive. Think of it as a private, self-hosted alternative to apps like Mint/GuiaBolso where all data stays on the user's own device. The app and its UI copy are in Brazilian Portuguese (pt-br).

**How it's built (technical):** Gestão Financeira is a **client-only personal finance manager**. Built with **Next.js 15 (App Router) + React 19 + TypeScript**, statically exported (`output: 'export'`) and deployed as a **PWA to GitHub Pages** via the `gh-pages` branch. There is **no backend server** — all data lives in the browser.

## Architecture

### Routing & app shell
- Feature routes live under `src/app/<feature>` (e.g. `caixa`, `metas`, `patrimonio`, `emprestimos`, `relatorios`, `notas`, `configuracoes`, `auth`, `faq`).
- **Convention**: `page.tsx` is a thin wrapper that renders `<Layout><FeatureComponent /></Layout>`; the actual logic lives in `page-component.tsx` (or inline in `page.tsx` for smaller pages). Feature subcomponents live in `components/`, using kebab-case filenames and PascalCase exports (e.g. `transacao-form.tsx` → `TransacaoForm`).
- `src/app/shared/layout.tsx` is the app shell: wraps pages with `AppProviders`, `Header`, `HeaderSidebar`, `BottomNavbar`, `Notifications`, `Footer`, `ErrorHandler` (react-error-boundary + GTM error reporting).
- PWA manifest: `src/app/manifest.ts` (static, `force-static`). Service worker: `src/app/service-worker/app-worker.ts` (Serwist, offline fallback at `src/app/offline`).

### React contexts (`src/app/contexts`)
Global state is provided via context, not a global store: `ErrorHandlerProvider`, `EnvProvider`, `NotificationProvider`, `LocationProvider`, `LoggingProvider`, `AuthProvider` (Google Drive OAuth), `ThemeProvider` (light/dark, persisted to localStorage), and **`StorageProvider`** — the most important one, exposing `repository`, `isDbOk`, and DB export/import/refresh helpers, and instantiating all repositories.

### Data layer — sql.js + localforage (critical to understand)
- The database is **SQLite compiled to WASM (`sql.js`)**, run inside a Web Worker, not directly in the main thread.
- `src/app/workers/db-broadcast.ts` and `db-connector.ts` route `exec`/`open`/`export` calls between the app and the SQL worker via `BroadcastChannel`.
- `src/app/repositories/database-connector.ts` wraps this worker connection; DB bytes are persisted to **`localforage`** (key `gestao-financeira.settings.db`) and reloaded on startup.
- All repositories extend **`DefaultRepository`** (`src/app/repositories/default.ts`), which provides `save`/`saveAll`/`delete`/`list`/`get`/`insert`/`update`. `save()` inserts when there's no `id`, otherwise updates; `createdDate`/`updatedDate` are auto-managed. After every mutation, `persistDb()` exports the DB and saves it to localforage — **don't bypass this** when adding new write paths.
- SQL is **parameterized** with `$name` placeholders (e.g. `where strftime('%m', data) = $month`). Row mapping goes through `parseSqlResultToObj()` with per-repo `DEFAULT_MAPPING` (handles dates via `moment`, decimals via `bignumber.js`, booleans, ignored fields).
- **Schema/migrations** are inline, imperative SQL in `default.ts`, gated by a `migrations` table (`if (migrations['name'] == null) { ...ALTER/CREATE...; migrations['name'] = true }`). When changing schema, add a new guarded migration step rather than editing existing ones.
- Use **`bignumber.js`** for monetary values and **`moment`** for dates, consistent with existing repositories — don't introduce plain floats or native `Date` string formatting for persisted data.

### UI conventions
- **Bootstrap 5 + SCSS**, not CSS modules. `_bootstrap.scss` imports Bootstrap primitives; `_theme.scss` overrides Bootstrap variables (colors, `$body-bg`, etc.) before import; `globals.scss` defines global utility/component classes (e.g. `.card-material-1`, `.side-bar-menu`) plus dark-mode overrides via `@include color-mode(dark)`.
- Reusable components live in `src/app/components/`: `input.tsx` (typed input adapter for number/date/month/checkbox/markdown), `modal.tsx` (custom Bootstrap modal), `general-chart.tsx` (lazy ApexCharts wrapper with shared `defaultChartOptions`), `md-text-area.tsx` (EasyMDE), `loader.tsx`, plus app-chrome components (`header.tsx`, `bottom-navbar.tsx`, etc.).
- Charts: use the shared `general-chart.tsx` wrapper (ApexCharts) rather than importing `react-apexcharts` directly. Drag-and-drop uses `@dnd-kit` (see `caixa/components/editar-em-massa.tsx`). Icons come from `@material-design-icons/svg`.
- Forms commonly accept `cleanStyle`, `onClose`, `onCustomSubmit`, `onCustomDelete` props — follow this shape for new forms/modals.

## Conventions & constraints
- **Path alias**: `@/*` → `./src/*` (see `tsconfig.json`). `strict` is **false** — be careful with implicit `any`, but don't silently introduce unsafe patterns in new code.
- TypeScript target `ES2017`, `jsx: preserve`, `moduleResolution: bundler`.
- ESLint extends only `next/core-web-vitals` — keep changes lint-clean (`npm run lint`).
- App is localized in **pt-br** (`<html lang="pt-br">`) — UI copy/strings should be in Brazilian Portuguese, consistent with the rest of the app.
- Remember this is a **statically exported** app (`output: 'export'`, `images.unoptimized: true`, `basePath`/`assetPrefix` = `/gestao-financeira` outside dev) — avoid Next.js features that require a server (API routes, dynamic SSR-only APIs).

## Testing
- Jest + `next/jest` + `jsdom` environment (`jest.config.ts`), coverage via `v8`.
- Tests are **colocated** under a feature's `__tests__/` folder using `*.test.tsx` naming (e.g. `src/app/caixa/components/__tests__/transacao-form.test.tsx`).
- Use **React Testing Library** (`render`, `screen`, `fireEvent`, `waitFor`, `getByLabelText`/`getByRole`) and `jest.mock(...)` to stub app contexts (e.g. storage/repository context) rather than hitting the real sql.js/localforage stack.
- Run tests with `npm test` (or `npm run dev-test` to watch). Run lint with `npm run lint`.

## Build & deploy
- `npm run build` → static site in `out/`. `npm run deploy` publishes `out/` to the `gh-pages` branch (adds `.nojekyll` via `predeploy`).
- Version bumps use `npm version <newversion>`, then `git push && git push --tags`, then `npm run deploy`, then create a GitHub Release. See `README.md` for the full release checklist.
