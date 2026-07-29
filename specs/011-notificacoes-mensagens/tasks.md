# Tasks: Notificações e Mensagens

Checklist for implementing `spec.md` / `plan.md`. Work top to bottom; each
task should be a small, reviewable commit.

- [ ] **T1 — Migration + `TableNames.NOTIFICACOES`**
  - Add the guarded `migrations['notificacoes']` block to `runMigrations()`
    in `src/app/repositories/default.ts` creating the `notificacoes` table
    (`id, tipo, titulo, descricao, lida, data, createdDate, updatedDate`).
  - Add `NOTIFICACOES = "notificacoes"` to the `TableNames` enum.

- [ ] **T2 — `NotificacoesRepository`**
  - Create `src/app/repositories/notificacoes.ts`: `Notificacao` interface,
    `TipoDeNotificacao` enum (`NOTIFICACAO = 0`, `MENSAGEM = 1`), extended
    `DEFAULT_MAPPING`, and methods `listByTipo`, `countUnread`,
    `marcarComoLida`, `marcarTodasComoLidas`, `limparLidas(diasRetencao?)`.

- [ ] **T3 — Repository unit tests**
  - `src/app/repositories/__tests__/notificacoes.test.ts` mirroring
    `default.test.ts`'s `IDatabase` mock: cover `listByTipo` mapping,
    `countUnread`, `marcarComoLida`/`marcarTodasComoLidas` SQL, and both
    branches of `limparLidas` (with/without `diasRetencao`, asserting the
    date-threshold math via mocked `moment`/system time).

- [ ] **T4 — Guarded seed migration for hardcoded Mensagens**
  - Add a `migrations['notificacoes_seed_mensagens']` guarded block in
    `runMigrations()` inserting 1-2 hardcoded `MENSAGEM` rows (e.g. a
    welcome/"novidades" message), same pattern as the `categoria_transacoes`
    "Outros" seed row.

- [ ] **T5 — Register the repository in `contexts/storage.tsx`**
  - Add `notificacoes: NotificacoesRepository` to the `Repo` interface and
    instantiate it in `startStorage()`.
  - In `reload()`, add a fire-and-forget `repository.notificacoes.limparLidas(30)`
    call (catch/log only, must not block startup) — the automatic cleanup.

- [ ] **T6 — Persist Notificação on existing error paths**
  - In `contexts/storage.tsx`'s `doGDriveSave`/`doGDriveLoad` catch blocks
    and the refresh-token failure branch in
    `loadRefreshTokenIfExistsAndSetIfNeed`, add a
    `repository.notificacoes.save(...)` call (tipo `NOTIFICACAO`) alongside
    the existing `NotificationUtil.send(...)` toast.
  - If reachable in the same pass, apply the same wiring to the
    import-error path (spec 007) and AI-chat-error path (spec 003);
    otherwise leave as an explicit immediate follow-up, not silently
    dropped.

- [ ] **T7 — Build `/notificacoes` page + `notificacao-item` component**
  - `src/app/notificacoes/page.tsx` (+ `page.scss`): `Layout` wrapper,
    Bootstrap `nav-tabs` for Notificações/Mensagens driven by
    `?tipo=notificacao|mensagem`, `list-group` of items newest-first,
    "Marcar todas como lidas" and "Limpar lidas" (window.confirm-gated)
    buttons, pt-br empty state, `Loader` while loading.
  - `src/app/notificacoes/components/notificacao-item.tsx`: renders
    `titulo`, markdown `descricao` (`MarkdownUtils.render`), formatted
    `data` (moment), read/unread visual state, click-to-mark-read.

- [ ] **T8 — Component tests**
  - `src/app/notificacoes/components/__tests__/notificacao-item.test.tsx`:
    render read vs unread item, assert markdown body renders, assert
    click triggers mark-as-read callback only when unread.

- [ ] **T9 — Sidebar wiring (`header-sidebar.tsx`)**
  - Replace the two `href="#"` links with real `Link`s to
    `/notificacoes?tipo=notificacao` / `/notificacoes?tipo=mensagem`.
  - Load unread counts via `repository.notificacoes.countUnread` once
    `isDbOk`; only render each badge `<span>` when its count is `> 0`.

- [ ] **T10 — Manual verification**
  - Trigger a Drive save/load failure (or temporary throw) and confirm a
    Notificação row appears and its badge count updates.
  - Confirm the Mensagens tab shows the seeded message(s).
  - Confirm mark-as-read (single + "todas"), "Limpar lidas", and badge
    counts all behave correctly across a page reload.
  - Confirm read items older than 30 days are purged automatically on
    next app start (can simulate by backdating `updatedDate` directly in
    the local sqlite dump for a manual check).

- [ ] **T11 — Lint/build/test gate**
  - Run `npm run lint` and `npm test` (full suite) and confirm everything
    passes before merging.

## Out of scope (future follow-ups, not part of this work)
- Due-date reminders for `emprestimos`/`metas` feeding into
  `TipoDeNotificacao.NOTIFICACAO` (see `006-emprestimos`'s deferred idea).
- Configurable retention period (hardcoded 30 days for now).
- Dropdown/preview panel on the sidebar icons (rejected in favor of direct
  page navigation).
- Push notifications, e-mail, or any cross-device delivery.
