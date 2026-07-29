# Plan: Notificações e Mensagens

Companion technical design for `spec.md`. Describes the target data model,
repository methods, file layout, and testing strategy.

## Data model
New table `notificacoes`:

| column        | type     | notes |
|---------------|----------|-------|
| `id`          | INTEGER  | PK, autoincrement (standard) |
| `tipo`        | INTEGER  | `TipoDeNotificacao` enum: `0 = NOTIFICACAO` (bell), `1 = MENSAGEM` (envelope) |
| `titulo`      | TEXT     | short title, e.g. "Falha ao salvar no Google Drive" |
| `descricao`   | TEXT     | body, markdown-rendered like `notas`/`metas`' `comentario` |
| `lida`        | INTEGER  | boolean (0/1), default 0 (unread) |
| `data`        | DATETIME | when the event/message happened (defaults to `now()` at insert) |
| `createdDate` | DATETIME | standard `DefaultFields` |
| `updatedDate` | DATETIME | standard `DefaultFields` — doubles as "read at" timestamp, since `marcarComoLida` goes through the existing `update()` path which always sets it |

No monetary fields, so no `bignumber.js` involvement here.

## Migration
Guarded block in `runMigrations()` (`src/app/repositories/default.ts`):

```ts
if (migrations['notificacoes'] == null) {
  await this.db.exec(`CREATE TABLE IF NOT EXISTS "notificacoes" ("id" INTEGER NOT NULL,"tipo" INTEGER NOT NULL,"titulo" TEXT NULL DEFAULT NULL,"descricao" TEXT NULL DEFAULT NULL,"lida" INTEGER NOT NULL DEFAULT 0,"data" DATETIME NOT NULL,"createdDate" DATETIME NOT NULL,"updatedDate" DATETIME NULL DEFAULT NULL,PRIMARY KEY ("id"));`);
  migrations['notificacoes'] = RUNNED_MIGRATION_CODE;
}
```

Add `NOTIFICACOES = "notificacoes"` to the `TableNames` enum
(`src/app/repositories/default.ts`).

## Repository (`src/app/repositories/notificacoes.ts`)
```ts
export interface Notificacao extends DefaultFields {
  tipo: TipoDeNotificacao
  titulo?: string
  descricao?: string
  lida: boolean
  data: Date
}

export enum TipoDeNotificacao {
  NOTIFICACAO = 0, // bell — system/error alerts
  MENSAGEM = 1,    // envelope — informative app messages
}

export class NotificacoesRepository extends DefaultRepository {
  // DEFAULT_MAPPING extended: data/createdDate/updatedDate -> DATE_TIME, tipo -> NUMBER, lida -> BOOLEAN

  // Fetch a tipo's items newest-first (delegates to `list` + filter/order, or a dedicated SELECT ... WHERE tipo = $tipo order by data desc)
  listByTipo(tipo: TipoDeNotificacao): Promise<Notificacao[]>

  // COUNT(*) where tipo = $tipo and lida = 0 — powers the sidebar badges
  countUnread(tipo: TipoDeNotificacao): Promise<number>

  // UPDATE ... SET lida = 1 WHERE id = $id (goes through existing `update()`, so updatedDate is set = "read at")
  marcarComoLida(id: number): Promise<void>

  // UPDATE ... SET lida = 1 WHERE tipo = $tipo AND lida = 0
  marcarTodasComoLidas(tipo: TipoDeNotificacao): Promise<void>

  // Idempotent: INSERT hardcoded MENSAGEM rows only if none exist yet (checked by a stable marker, e.g. reuse the `migrations` table with its own guarded key, OR check `count(*) where tipo = MENSAGEM` == 0 before inserting). Prefer the `migrations`-guarded approach for consistency with the rest of the schema — seed rows are treated as a data migration, not called ad-hoc on every load.
  seedMensagensPadrao(): Promise<void>

  // DELETE WHERE lida = 1 [AND updatedDate < now - diasRetencao days when diasRetencao is provided]
  limparLidas(diasRetencao?: number): Promise<void>
}
```

`seedMensagensPadrao()` is invoked once from `runMigrations()` itself
(as a guarded `migrations['notificacoes_seed_mensagens']` block that
directly inserts 1-2 hardcoded rows), not as a repository method called
from the UI — this keeps seeding idempotent and consistent with how
`categoria_transacoes` seeds its "Outros" row today. (The method is kept
on the repository mainly to make the insert logic unit-testable in
isolation; `runMigrations()` can call the same SQL directly.)

## Registering the repository (`src/app/contexts/storage.tsx`)
Add `notificacoes: NotificacoesRepository` to the `Repo` interface;
instantiate `repository.notificacoes = new NotificacoesRepository(sqldb)`
in `startStorage()`, same pattern as `metas`/`notas`/`patrimonio`.

In `reload()`, alongside the existing `categoriaTransacoes.loadAll()` and
`loadRefreshTokenIfExistsAndSetIfNeed()` calls, add a fire-and-forget
call to `repository.notificacoes.limparLidas(30)` — this is the
"automatic cleanup on app start" from the spec. No toast/confirmation;
failures should be caught/logged only (must never block app startup).

## Wiring existing error call sites to persist a Notificação
In `contexts/storage.tsx`'s `doGDriveSave`/`doGDriveLoad` catch blocks
and `loadRefreshTokenIfExistsAndSetIfNeed`'s failure branch, add a
`repository.notificacoes.save(TableNames.NOTIFICACOES, { tipo: TipoDeNotificacao.NOTIFICACAO, titulo: '...', descricao: '...', lida: false, data: new Date() })`
call next to the existing `NotificationUtil.send(...)` toast call.
Spec 007's import-error path and spec 003's AI-chat-error path get the
same treatment when their code is touched (or as an immediate follow-up
task if out of reach in this pass — see `tasks.md`).

## Target file layout
```
src/app/
  repositories/
    notificacoes.ts
    __tests__/
      notificacoes.test.ts
  notificacoes/
    page.tsx
    page.scss
    components/
      notificacao-item.tsx
      __tests__/
        notificacao-item.test.tsx
```

## UI design
- Route: `/notificacoes`, following the `metas/page.tsx` shape (`Layout`
  wrapper, `container mt-3 d-flex flex-column gap-3`, `<h1>`).
- Tab selection via `?tipo=notificacao` / `?tipo=mensagem` query param
  (read with `useSearchParams`), rendered as Bootstrap `nav-tabs` at the
  top of the page — switching tabs updates the query param via
  `router.push` (no full reload, list re-fetched per tipo).
- List: `list-group` of `notificacao-item.tsx` rows, newest-first
  (`data` desc), unread items visually distinguished (e.g.
  `list-group-item-light` for read vs a subtly highlighted/bold variant
  for unread — mirroring the existing `list-group-item-info/success/...`
  contextual-class pattern from `metas/page.tsx`). Each item shows
  `titulo`, markdown-rendered `descricao` (via `MarkdownUtils.render`,
  same as `notas`/`metas`), and a relative/formatted `data` (moment).
  Clicking an unread item calls `marcarComoLida(id)` and refreshes.
- Header actions: "Marcar todas como lidas" button (calls
  `marcarTodasComoLidas(tipo)` for the active tab) and "Limpar lidas"
  button (gated by `window.confirm`, mirroring `doGDriveSave`/
  `doGDriveLoad`'s confirm pattern, calls `limparLidas()` with no age
  filter for the active tab's read items, then reloads the list).
- Empty state: pt-br `alert alert-info` message per tab, same pattern as
  `metas/page.tsx`'s "Nenhuma meta encontrada...".
- Loading state: `Loader` component, same as `metas/page.tsx`.
- Sidebar (`header-sidebar.tsx`): replace the two dead `href="#"` links
  with `<Link href="/notificacoes?tipo=notificacao">` /
  `<Link href="/notificacoes?tipo=mensagem">`; badge `<span>` only
  rendered when `countUnread(tipo) > 0` (currently always rendered as a
  static empty dot); counts loaded via `repository.notificacoes.countUnread`
  once `isDbOk` (same lifecycle as other sidebar/user data) and
  refreshed after `marcarComoLida`/`marcarTodasComoLidas`/`limparLidas`
  actions (e.g. via the existing `refresh()` from `useStorage()`).

## Testing strategy
- `repositories/__tests__/notificacoes.test.ts` — mirrors
  `default.test.ts`'s `IDatabase` mock approach (see spec
  `008-testes-unitarios-basicos`): assert `listByTipo` SQL + mapping
  (`tipo`→NUMBER, `lida`→BOOLEAN, `data`/`createdDate`/`updatedDate`→
  DATE_TIME), `countUnread` SQL + returned count, `marcarComoLida`/
  `marcarTodasComoLidas` SQL, and `limparLidas`:
  - no `diasRetencao` → `DELETE ... WHERE lida = 1` (no date filter).
  - with `diasRetencao` → `DELETE ... WHERE lida = 1 AND updatedDate < $threshold`,
    asserting the threshold date math (mock `moment`/system time, same
    approach as `date.test.ts`'s `jest.useFakeTimers()`).
- `notificacoes/components/__tests__/notificacao-item.test.tsx` — smoke
  test rendering a read and an unread item, asserting markdown body
  renders and click triggers the "mark as read" callback prop only when
  unread.

## Rollout / risk mitigation
1. Land migration + `TableNames.NOTIFICACOES` + `NotificacoesRepository`
   + its unit tests first (fully unit-testable, no UI risk).
2. Register the repository in `contexts/storage.tsx`, wire the automatic
   `limparLidas(30)` call into `reload()`, and wire the Google
   Drive/refresh-token error call sites to also persist a Notificação.
3. Add the guarded `notificacoes_seed_mensagens` migration with 1-2
   hardcoded Mensagens.
4. Build the `/notificacoes` page + `notificacao-item` component + its
   tests.
5. Wire the sidebar bell/envelope links + live badge counts in
   `header-sidebar.tsx`.
6. Manual verification: trigger a Drive save/load failure (or a
   temporary throw) and confirm a Notificação appears; confirm the
   Mensagens tab shows the seeded message(s); confirm mark-as-read,
   "marcar todas como lidas", and "Limpar lidas" all update counts/list
   correctly; confirm badges disappear at 0 unread; run `npm run lint`
   and `npm test` (full suite) before considering the feature done.
