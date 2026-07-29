# Tasks: Auto save automático dos dados no Google Drive

Checklist for implementing `spec.md` / `plan.md`. Work top to bottom; each
task should be a small, reviewable commit.

- [ ] **T1 — Debounce utility**
  - Add `src/app/utils/debounce.ts`: dependency-free trailing-edge debounce
    helper returning `{ run, cancel }`.

- [ ] **T2 — Debounce unit tests**
  - Add `src/app/utils/__tests__/debounce.test.ts` using
    `jest.useFakeTimers()`: only the last call within the window fires,
    `cancel()` prevents a pending call, independent instances don't
    interfere.

- [ ] **T3 — `DefaultRepository` persist-listener hook**
  - In `src/app/repositories/default.ts`, add `setOnPersisted(cb)` and
    invoke it at the end of `persistDb()`.

- [ ] **T4 — Repository tests for the persist-listener**
  - Extend `src/app/repositories/__tests__/default.test.ts` (from spec 008):
    `persistDb()` invokes a registered listener once per call;
    `setOnPersisted(undefined)` removes it without throwing.

- [ ] **T5 — New `parametros` keys**
  - In `src/app/repositories/parametros.ts`, export
    `AUTO_SAVE_GDRIVE_ENABLED` and `GDRIVE_LAST_SYNC_MODIFIED_TIME`, seed
    both with empty-string defaults in `loadParamsOrDefault()`.

- [ ] **T6 — `GDriveUtil.modifiedTime` support**
  - In `src/app/utils/gdrive.ts`, add `modifiedTime: string` to `GDriveFile`
    and request it via the Drive API `fields` param in
    `getFirstFileByName`.

- [ ] **T7 — Wire persist-listener + debounce into `StorageProvider`**
  - In `src/app/contexts/storage.tsx`: load/expose `isAutoSaveEnabled`,
    `isAutoSaving`, `lastSyncedAt` state; call `repo.setOnPersisted(...)` on
    every repo instance after `startStorage()` builds them (not on the
    migration-only throwaway repo); create the 10s debounce via `useRef`;
    guard with an `isAutoSaving` single-flight flag; refactor
    `updateGDrive`/`loadGDrive` to be reusable silently (no confirm/success
    notification) from the auto save/auto load paths; notify only on
    error; update `GDRIVE_LAST_SYNC_MODIFIED_TIME` after every successful
    save/load (manual or automatic); cancel the debounce when the toggle is
    turned off.

- [ ] **T8 — Startup auto-load with version check**
  - New effect in `storage.tsx`: once `isDbOk && isAuthOk` and auto save is
    enabled, fetch the Drive file, compare `modifiedTime` against the local
    `GDRIVE_LAST_SYNC_MODIFIED_TIME` marker; load silently if no marker or
    it matches; otherwise `window.confirm` with pt-br copy before loading;
    update the marker after a successful load.

- [ ] **T9 — `AutoSaveGDriveToggle` UI**
  - Add to `src/app/components/auth-button.tsx`, inside the `isAuthOk`
    branch alongside `LoadGDriveButton`/`SaveGDriveButton`: Bootstrap
    `form-switch` (via the shared `Input` checkbox mode), pt-br label +
    helper caption, "última sincronização" hint, small inline spinner while
    `isAutoSaving`. Use compact/wrapping styles so it fits both the sidebar
    (`header-sidebar.tsx`'s `SideBarExtra`) and the Configurações page
    section without overflow.

- [ ] **T10 — `AuthButton` component tests**
  - Add `src/app/components/__tests__/auth-button.test.tsx`: toggle only
    renders when `isAuthOk`; toggling updates the auto save parametro;
    spinner shows only while auto-saving; toggle absent when logged out.

- [ ] **T11 — Manual verification**
  - Run through the manual checklist in `plan.md`'s "Testing strategy"
    section (debounced single upload for rapid edits, error notification on
    failure without blocking local save, silent vs. confirmed startup
    load, responsive layout in sidebar + Configurações at mobile width).

- [ ] **T12 — Lint/build/test gate**
  - Run `npm run lint` and `npm test` (full suite) and confirm everything
    passes before merging.

## Out of scope (future follow-ups, not part of this work)
- Retry/backoff strategy for failed automatic Drive uploads.
- Drive quota/storage usage warnings surfaced to the user.
- Smarter conflict resolution (row-level diff) beyond the single
  `modifiedTime` check, for true multi-device concurrent editing.
