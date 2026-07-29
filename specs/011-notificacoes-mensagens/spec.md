# Spec: Notificações e Mensagens

## Status
`Draft` — not yet started. Captured from a design discussion on 2026-07-28.

## Tracking
GitHub issue: https://github.com/loewesolucoes/gestao-financeira/issues/41
Related specs:
- `006-emprestimos/spec.md` — its "Future ideas" explicitly deferred
  due-date reminders/notifications for parcelas; once this spec lands,
  that becomes a natural consumer of the new `notificacoes` table
  (`TipoDeNotificacao.NOTIFICACAO`).
- `007-importar-planilha-caixa-patrimonio/plan.md` — its import
  success/error feedback uses `NotificationUtil.send(...)`; this spec
  wires that error case to also persist a `Notificação` row.
- `009-auto-save-gdrive/spec.md` — its Drive auto-save error path uses
  `NotificationUtil.send(...)`; same wiring applies (persist on error).
- `003-relatorios-ai-chat/plan.md` — its AI chat errors are routed
  through `NotificationUtil`; same wiring applies (persist on error).

## Problem statement
The sidebar (`src/app/components/header-sidebar.tsx`) already renders a
bell (`IconBell`, from `@material-design-icons/svg/filled/notifications.svg`)
and an envelope (`IconEnvelope`, from
`@material-design-icons/svg/filled/inbox.svg`) with static unread-style
badge dots, but both are dead links (`href="#"`) with no data behind
them:

```tsx
<Link className="nav-link p-0" href="#" role="button" aria-expanded="false">
  <IconBell />
  <span className="position-absolute top-0 start-100 translate-middle p-1 bg-secondary border rounded-circle"></span>
</Link>
```

Today the app's only "notification" concept
(`src/app/utils/notification.ts`'s `NotificationUtil.send`, consumed via
`src/app/contexts/notification.tsx` and rendered by
`src/app/components/notifications.tsx`) is a fully **ephemeral**
`BroadcastChannel` toast: once dismissed (or after
`TIME_TO_CLOSE_NOTIFICATION` = 10s), the message is gone forever. There
is no persisted notification/message history anywhere in the app.

### Why this is a problem
- The bell/envelope icons look interactive but do nothing — broken UX.
- Important error events (Google Drive save/load failures, spreadsheet
  import failures, AI chat errors) only flash as a 10s toast; if the
  user misses it, the information is lost.
- There's no way to communicate app-level information (release notes,
  tips, general notices) to the user at all today.
- Nothing is ever cleaned up automatically, so once persistence exists,
  an unbounded table would otherwise grow forever.

## Goals
1. Persist two kinds of items in a new `notificacoes` table:
   - **Notificações** (bell): system/error alerts, populated by wiring
     existing `NotificationUtil.send(...)` **error** call sites
     (`contexts/storage.tsx` Google Drive save/load failures and
     refresh-token failure; the import-error and AI-chat-error paths
     from specs 007/009/003) to also persist a row.
   - **Mensagens** (envelope): informative app messages, manually
     seeded/hardcoded in code (e.g. "novidades da versão", dicas,
     avisos gerais) — this app has no backend/other users to message
     from.
2. Build a dedicated `/notificacoes` page (no modal) with two tabs —
   Notificações / Mensagens — selected via a query param
   (`?tipo=notificacao` / `?tipo=mensagem`), listing items newest-first,
   with per-item "mark as read" and a "marcar todas como lidas" action.
3. Wire the sidebar bell/envelope icons to real
   `<Link href="/notificacoes?tipo=...">` navigation (no dropdown/preview
   panel) with badges showing live unread counts (hidden when the count
   is 0, instead of an always-on static dot).
4. Add retention/cleanup so the table doesn't grow unbounded:
   - **Automatic**: on every app start, silently purge read items whose
     read timestamp is older than 30 days.
   - **Manual**: a "Limpar lidas" button on the `/notificacoes` page
     (confirmation-gated) that immediately removes all currently-read
     items, regardless of age.

## Non-goals
- **Not implementing the actual code change in this spec** — this spec
  (with its companion `plan.md`/`tasks.md`) only documents the planned
  change; the actual implementation in `src/app/**` is a follow-up piece
  of work.
- No due-date reminders for `emprestimos`/`metas` in this pass (left as
  a future consumer of the new table — see `006-emprestimos`).
- No push notifications, e-mail, or any cross-device delivery — this is
  a local-first, single-user app.
- No dropdown/preview panel on the sidebar icons — direct page
  navigation only (explicitly rejected a modal-based UX too).
- No configurable retention period UI — the 30-day threshold is
  hardcoded for this iteration.
- No changes to the existing ephemeral toast mechanism
  (`NotificationUtil`/`useNotification`/`Notifications` component) — it
  keeps working as-is for immediate feedback; the new table is an
  additional, persisted layer, not a replacement.

## Constraints (project-specific)
- App is a **static export** (`output: 'export'`), fully client-side,
  offline-first PWA — no server-side code; all persistence goes through
  the existing sql.js-in-a-Web-Worker + localforage stack
  (`repositories/default.ts` / `database-connector.ts`).
- New tables must be added via the existing migrations mechanism (guarded
  `if (migrations['name'] == null) { ...; migrations['name'] = true }`
  blocks in `runMigrations()` in `src/app/repositories/default.ts`).
- Monetary values must use **`bignumber.js`**, dates must use **`moment`**
  (not directly relevant here — no monetary fields — but the `data`,
  `createdDate`, `updatedDate` fields follow the same `DATE_TIME`
  mapping as `notas`/`metas`).
- UI copy must be in **Brazilian Portuguese (pt-br)**.
- UI must follow existing conventions (Bootstrap 5 + SCSS, shared
  `Modal`/`Input` components where applicable, `page.tsx`/
  `components/` layout, list-group pattern from `metas/page.tsx`).
- Reuse the existing `list-group-item-*` Bootstrap contextual classes
  and `MarkdownUtils.render` pattern (as done in `notas`/`metas`) for the
  message body, for visual/markup consistency.

## Acceptance criteria
- [ ] A new `notificacoes` table exists (via guarded migration) storing
      both Notificações and Mensagens, distinguished by `tipo`.
- [ ] `repository.notificacoes` is registered in `contexts/storage.tsx`
      the same way `metas`/`notas` are.
- [ ] Google Drive save/load errors and the refresh-token failure in
      `contexts/storage.tsx` persist a Notificação row in addition to
      the existing toast.
- [ ] At least one hardcoded "Mensagem" is seeded so the envelope tab is
      not empty by default.
- [ ] `/notificacoes` page renders both tabs, lists items newest-first,
      supports marking a single item as read (on click) and "marcar
      todas como lidas", and shows a pt-br empty state when a tab has no
      items.
- [ ] Sidebar bell/envelope (`header-sidebar.tsx`) link to
      `/notificacoes?tipo=notificacao` / `?tipo=mensagem` respectively,
      and their badges reflect live unread counts (hidden at 0).
- [ ] Automatic cleanup purges read items older than 30 days on app
      start; a manual "Limpar lidas" button on the page removes all
      currently-read items immediately (confirmation-gated).
- [ ] `npm run lint` and `npm test` (including new tests) pass once
      implemented.

## Future ideas (documented only — not implemented by this spec)
- Wire `emprestimos`/`metas` due-date reminders into
  `TipoDeNotificacao.NOTIFICACAO` (per `006-emprestimos`'s deferred
  future idea).
- Configurable retention period (currently hardcoded 30 days).
- Optional dropdown/preview panel on the sidebar icons, if a future
  design pass revisits the "no preview" decision made here.
