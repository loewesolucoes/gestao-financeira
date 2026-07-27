# Spec: Auto save automático dos dados no Google Drive

## Status
`Draft` — not yet started. Captured from a design discussion on 2026-07-27.

## Tracking
GitHub issue: https://github.com/loewesolucoes/gestao-financeira/issues/28
Related specs: None — this is the first spec touching the Google Drive
save/load flow (`src/app/contexts/storage.tsx`, `src/app/utils/gdrive.ts`,
`src/app/contexts/auth.tsx`).

## Problem statement
Today, saving/loading data to/from Google Drive
(`src/app/contexts/storage.tsx`'s `doGDriveSave`/`doGDriveLoad`) is a fully
manual, one-off action: the user must open **Configurações** (or the sidebar)
and click "Salvar no drive" / "Carregar do drive" every time, each gated by a
`window.confirm`. Since the app is fully client-side (sql.js + localforage,
no server), the Drive copy is the only durable backup across devices/browser
data loss, and now that refresh-token-based auth exists (issue that added
`GOOGLE_DRIVE_REFRESH_TOKEN` support), it's feasible to keep it in sync
automatically instead of relying on the user to remember to click "Salvar".

### Why this is a problem
- Users can lose data (browser storage cleared, new device) if they forget
  to manually save to Drive after entering transactions.
- `DefaultRepository.persistDb()` (`src/app/repositories/default.ts`)
  already runs after **every** `save`/`saveAll`/`delete` across all
  repositories (`transacoes`, `metas`, `notas`, `patrimonio`,
  `categoriaTransacoes`, `params`) — but only persists to `localforage`,
  never to Drive.
- There's no way today to opt into "always keep Drive in sync"; the issue
  explicitly asks for a toggle for this.

## Goals
1. Add an **auto save toggle** (pt-br labelled) that, when enabled, uploads
   the database to Google Drive automatically after data-changing operations
   (transações and all other repositories going through
   `DefaultRepository.persistDb()`), without a `window.confirm` per save.
2. Debounce automatic uploads (10s trailing debounce, single-flight guarded)
   so rapid successive saves (e.g. bulk edit via drag-and-drop) coalesce
   into a single Drive upload instead of one request per change.
3. When the app starts and auto save is enabled, automatically load the
   latest data from Drive — but only after checking whether Drive's version
   is actually different from what was last synced locally, to avoid
   silently clobbering unsynced local data (see Goal 4).
4. Compare Google Drive's file `modifiedTime` against a locally stored
   last-synced marker before the startup auto-load: load silently if there
   is no prior marker (first time) or the marker matches; otherwise ask the
   user to confirm before overwriting local data with the Drive version.
5. Surface the toggle (and a small inline "saving..." indicator, and a "last
   synced" hint) in the shared `AuthButton` component
   (`src/app/components/auth-button.tsx`), so it shows up **both** in the
   sidebar (`header-sidebar.tsx`) and in `configuracoes/page.tsx` without
   duplicating UI logic, following the existing Salvar/Carregar button
   pattern (only visible when `isAuthOk`).
6. Keep the layout responsive: the toggle + label + status hint must reflow
   without overlap/overflow both in the narrow (~320px) sidebar card and in
   the wider Configurações page section.

## Non-goals
- Retry/backoff strategy for failed automatic Drive uploads (surfacing an
  error notification is enough for this iteration — see "Future ideas").
- Multi-device real-time sync/merge (e.g. conflict resolution beyond a
  single `modifiedTime` comparison, collaborative editing, partial/row-level
  sync). This spec only guards the single "is the Drive copy newer than what
  I last saw" case.
- Changing the manual "Salvar no drive"/"Carregar do drive" buttons'
  existing `window.confirm` behavior — they remain as-is for manual use;
  auto save/auto load are new, separate code paths.
- **Not implementing the actual code change in this spec** — this spec (with
  its companion `plan.md`/`tasks.md`) only documents the planned change; the
  actual implementation in `src/app/**` is a follow-up piece of work.

## Constraints (project-specific)
- App is a **static export** (`output: 'export'`), fully client-side,
  offline-first PWA — no server-side code; all persistence goes through the
  existing sql.js-in-a-Web-Worker + localforage stack
  (`repositories/default.ts` / `database-connector.ts`).
- New tables must be added via the existing migrations mechanism (guarded
  `if (migrations['name'] == null) { ...; migrations['name'] = true }`
  blocks in `runMigrations()` in `src/app/repositories/default.ts`) — not
  needed here since `parametros` is already a schemaless key/value store.
- Monetary values must use **`bignumber.js`**, dates must use **`moment`**.
- UI copy must be in **Brazilian Portuguese (pt-br)**.
- UI must follow existing conventions (Bootstrap 5 + SCSS, shared `Modal`/
  `Input` components, `page.tsx`/`page-component.tsx`/`components/` layout).
- Auto save must never block, delay, or fail the underlying local
  save/delete operation — it is a best-effort background side effect that
  runs *after* local persistence already succeeded.
- Must not introduce concurrent/overlapping Drive write requests (single
  file, last-write-wins semantics today — parallel writes risk corrupting
  or losing data).
- Must not spam the user with confirmation dialogs or notifications for
  routine auto-saves — only the startup version-conflict case and errors
  warrant user-facing interruption/notification.

## Acceptance criteria
- [ ] A toggle exists (rendered via `AuthButton`, visible only when
      authenticated) to enable/disable "auto save no Google Drive",
      persisted as a `parametros` row (`AUTO_SAVE_GDRIVE_ENABLED`).
- [ ] With the toggle enabled, performing any transação/meta/nota/
      patrimônio/categoria save or delete triggers a debounced (10s
      trailing) Drive upload; rapid successive changes produce a single
      upload, not one per change.
- [ ] While an automatic upload is in flight, a small inline loading
      indicator shows next to the toggle; on failure, a
      `NotificationUtil` message is shown; on success, no notification
      (silent).
- [ ] With the toggle disabled, no automatic Drive uploads occur (existing
      manual Salvar/Carregar behavior unaffected).
- [ ] On app startup with the toggle enabled: if there is no local
      last-synced marker, or the Drive file's `modifiedTime` matches it, the
      app loads silently from Drive; if the Drive file is newer/different,
      the user is asked via `window.confirm` (pt-br copy explaining the
      choice) before overwriting local data.
- [ ] The toggle + status/indicator render correctly (no overlap/overflow)
      in both the sidebar (`header-sidebar.tsx`) and
      `configuracoes/page.tsx` at mobile and desktop widths.
- [ ] Toggling auto save off cancels any pending debounced upload.
- [ ] `npm run lint` and `npm test` (including new tests) pass once
      implemented.

## Future ideas (documented only — not implemented by this spec)
- Retry with backoff for failed automatic Drive uploads instead of a single
  attempt + error notification.
- Surface Drive quota/storage usage warnings before/while auto-saving.
- Smarter conflict resolution (e.g. diffing rows instead of a whole-file
  `modifiedTime` check) for true multi-device concurrent editing.
