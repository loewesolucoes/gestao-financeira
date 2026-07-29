# Plan: Auto save automático dos dados no Google Drive

Companion technical design for `spec.md`. Describes the target data model,
repository methods, file layout, and testing strategy.

## Data model
No schema/table changes. Two new rows in the existing `parametros` table
(via `ParametrosRepository`, same mechanism already used for
`GOOGLE_DRIVE_REFRESH_TOKEN`):

| chave (key)                        | valor (value)                        | notes |
|-------------------------------------|---------------------------------------|-------|
| `AUTO_SAVE_GDRIVE_ENABLED`          | `"true"` \| `"false"` (string)        | toggle state, defaults to `"false"`/unset |
| `GDRIVE_LAST_SYNC_MODIFIED_TIME`    | Drive file `modifiedTime` (ISO string) | updated after every successful manual/auto save **and** load, used for the startup version-conflict check |

## Migration
No migration needed — `parametros` is already a schemaless key/value store
seeded lazily by `ParametrosRepository.loadParamsOrDefault()`. Add both new
keys to that default-seeding map, mirroring how `GOOGLE_DRIVE_REFRESH_TOKEN`
is seeded today, so `getValorByKey`/`set` work out of the box.

## Repository / util changes

### `src/app/repositories/default.ts` (`DefaultRepository`)
- Add an optional persist-listener: `private onPersisted?: () => void` and
  `public setOnPersisted(cb: (() => void) | undefined) { this.onPersisted = cb }`.
- At the end of `persistDb()`, after the existing `RepositoryUtil.persistLocalDump(dump)`
  call, invoke `this.onPersisted?.()` (fire-and-forget, synchronous call out
  — the listener itself handles async work/debouncing).
- No change to `saveAll`/`save`/`delete` — they already funnel through
  `persistDb()`.

### `src/app/repositories/parametros.ts` (`ParametrosRepository`)
- Export two new constants: `AUTO_SAVE_GDRIVE_ENABLED` and
  `GDRIVE_LAST_SYNC_MODIFIED_TIME` (string key names, same pattern as
  `GOOGLE_DRIVE_REFRESH_TOKEN`).
- Seed both with an empty-string default in `loadParamsOrDefault()`.

### `src/app/utils/gdrive.ts` (`GDriveUtil`)
- Extend `GDriveFile` interface with `modifiedTime: string`.
- Update `getFirstFileByName`'s Drive API request to include `modifiedTime`
  in the returned fields (Drive v3 `files.list` needs an explicit `fields`
  param, e.g. `fields=files(id,name,mimeType,kind,modifiedTime)`), so the
  version-conflict check has data to compare against.

### `src/app/utils/debounce.ts` (new)
- Small dependency-free trailing-edge debounce helper:
  `export function debounce<T extends (...args: any[]) => void>(fn: T, waitMs: number): { run: (...args: Parameters<T>) => void; cancel: () => void }`.
  `run()` resets a `setTimeout` timer each call; `cancel()` clears any
  pending timer. Kept generic/pure so it's unit-testable without touching
  Drive/React at all.

## Registering the persist-listener & auto save logic (`src/app/contexts/storage.tsx`)
- `StorageProvider` gains: `isAutoSaveEnabled` state (loaded from
  `repository.params.getValorByKey(AUTO_SAVE_GDRIVE_ENABLED)`), an
  `isAutoSaving` state (drives the inline spinner), and a `lastSyncedAt`
  string state (drives the "last synced" hint), plus `setAutoSaveEnabled`.
- After `startStorage()` builds all repo instances (`params`, `metas`,
  `notas`, `transacoes`, `patrimonio`, `categoriaTransacoes`), call
  `repo.setOnPersisted(scheduleAutoSave)` on **each** instance — *after*
  construction, never on the throwaway `DefaultRepository` used inside
  `RepositoryUtil.createFromPersistedLocalDump()` for migrations, so
  migration-time persists never trigger an auto save.
- `scheduleAutoSave` is a `debounce(runAutoSaveUpload, 10_000)` created once
  (e.g. via `useRef`) whose `.run()` is called from the listener, guarded by
  `if (!isAutoSaveEnabledRef.current || !isAuthOkRef.current) return;`
  (refs used to read latest state inside the stable debounced closure).
- `runAutoSaveUpload()`: guarded by an `isAutoSavingRef` single-flight flag
  (skip/re-queue trailing run if one is already in progress — never fire
  parallel uploads); sets `isAutoSaving(true)`, calls the same
  `updateGDrive()` used by `doGDriveSave` (refactored to be reusable without
  the `window.confirm`/success notification wrapper — see below), records
  the resulting file's `modifiedTime` into `GDRIVE_LAST_SYNC_MODIFIED_TIME`
  on success, calls `NotificationUtil.send(...)` only on failure (`catch`),
  then clears `isAutoSaving(false)`.
- Toggling `isAutoSaveEnabled` off calls `scheduleAutoSave.cancel()` to drop
  any pending debounced upload.
- Refactor `doGDriveSave`/`doGDriveLoad` internals: extract the Drive
  read/write calls (`updateGDrive`/`loadGDrive`, already private functions
  in `storage.tsx`) so they're shared between the manual
  (confirm+notify) and automatic (silent success / notify-only-on-error)
  call sites — no duplicated Drive API logic.
- **Startup auto-load** (new `useEffect`, runs once after `isDbOk` and
  `isAuthOk` are both true, only if `isAutoSaveEnabled`):
  1. Fetch the Drive file via `GDriveUtil.getFirstFileByName` (now
     returning `modifiedTime`).
  2. Read local `GDRIVE_LAST_SYNC_MODIFIED_TIME` marker.
  3. If no file on Drive → nothing to load, no-op.
  4. If no local marker, or marker === file.modifiedTime → call the silent
     load path directly (no `window.confirm`).
  5. Else (marker differs) → `window.confirm('O Google Drive possui uma
     versão diferente dos dados salvos localmente. Deseja carregar os dados
     do Google Drive e substituir os dados locais?')`; only load if
     confirmed.
  6. After a successful load (silent or confirmed), update
     `GDRIVE_LAST_SYNC_MODIFIED_TIME` to the loaded file's `modifiedTime`.

## Registering the repository (`src/app/contexts/storage.tsx`)
No new repository to register — reuses existing `params`, and the
persist-listener is wired onto the existing repository instances (see
above).

## Target file layout
```
src/app/
  utils/
    debounce.ts
    __tests__/
      debounce.test.ts
    gdrive.ts               (edit: modifiedTime field)
  repositories/
    default.ts              (edit: setOnPersisted hook)
    parametros.ts            (edit: new keys)
    __tests__/
      default.test.ts         (edit: cover setOnPersisted/onPersisted)
  contexts/
    storage.tsx              (edit: auto save/auto load logic)
  components/
    auth-button.tsx          (edit: add AutoSaveGDriveToggle)
    __tests__/
      auth-button.test.tsx    (new)
```

## UI design
- New `AutoSaveGDriveToggle` sub-component inside `auth-button.tsx`,
  rendered inside the existing `isAuthOk` branch, alongside
  `LoadGDriveButton`/`SaveGDriveButton`:
  - A Bootstrap `form-switch` checkbox (via the shared `Input` component's
    checkbox mode) labelled in pt-br, e.g. "Salvar automaticamente no
    Google Drive".
  - A short helper caption below/beside it explaining the behavior in
    pt-br, plus a "última sincronização: HH:mm" hint derived from
    `lastSyncedAt`/`GDRIVE_LAST_SYNC_MODIFIED_TIME` when available.
  - A small inline spinner (reusing the existing `Loader` pattern already
    used for `isGDriveLoadLoading`/`isGDriveSaveLoading`) shown next to the
    switch while `isAutoSaving` is true — never a full-page loader.
  - Because `AuthButton` renders inside both the sidebar's narrow
    `user-info-card` (`header-sidebar.tsx`) and the wider Configurações
    "Google drive" `<section>`, the markup uses flex-wrap/small text sizing
    (`d-flex flex-column gap-2 small`) so it doesn't overflow the ~320px
    sidebar column, consistent with the rest of `SideBarExtra`'s styling.
- Startup version-conflict dialog: plain `window.confirm` with explicit
  pt-br copy (see step 5 above) — no new modal component needed, consistent
  with the existing manual save/load confirms.

## Testing strategy
- `src/app/utils/__tests__/debounce.test.ts`: fake timers (`jest.useFakeTimers`)
  covering trailing-edge behavior (only last call within the window fires),
  `cancel()` preventing a pending call, and independent debounced instances
  not interfering with each other.
- `src/app/repositories/__tests__/default.test.ts` (extend existing spec
  from `008`): assert `persistDb()` invokes a registered `onPersisted`
  callback exactly once per call, and that `setOnPersisted(undefined)`
  removes it (no throw when `persistDb` runs with no listener attached).
- `src/app/components/__tests__/auth-button.test.tsx` (new): mock
  `useAuth`/`useStorage`, verify: toggle only renders when `isAuthOk`;
  toggling calls `repository.params.set(AUTO_SAVE_GDRIVE_ENABLED, ...)` (or
  the storage context's exposed setter); spinner shows only while an
  auto-save mock flag is true; toggle absent entirely when logged out.
- Manual verification checklist (no automated Drive integration test — the
  real Drive API isn't mockable end-to-end in Jest):
  1. Enable toggle, add a transação, confirm (via devtools/network tab) a
     single debounced Drive PATCH ~10s later, no per-keystroke requests.
  2. Rapidly add/edit several transações within 10s, confirm only one
     upload fires after the last change.
  3. Disable Wi-Fi/simulate a Drive failure, confirm a
     `NotificationUtil` error appears and the local save still succeeded.
  4. Reload the app with toggle enabled and Drive file untouched since last
     sync → confirms silent load, no dialog.
  5. Manually edit the Drive file's content out-of-band (or bump
     `modifiedTime`), reload the app → confirms the `window.confirm` prompt
     appears before overwriting local data.
  6. Resize/inspect both the sidebar and Configurações page at mobile width
     to confirm no overlap/overflow of the new toggle+hint+spinner.

## Rollout / risk mitigation
1. Land `debounce.ts` + its unit tests first (fully isolated, no
   Drive/React dependency).
2. Land the `DefaultRepository.setOnPersisted` hook + repository tests next
   (still fully unit-testable via the mocked `IDatabase`).
3. Wire `parametros.ts` new keys + `GDriveUtil.modifiedTime` field.
4. Implement the `StorageProvider` auto save/auto load logic (highest-risk
   piece — concurrency guard and startup version check need careful manual
   verification per the checklist above).
5. Build the `AutoSaveGDriveToggle` UI in `auth-button.tsx` + its tests.
6. Manual verification checklist (above) before considering the feature
   done, then `npm run lint` / `npm test` full-suite gate.
