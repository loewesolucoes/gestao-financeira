# Spec: Diferença entre patrimônio e saldo no caixa

## Status
`Draft` — not yet started. Captured from a design discussion on 2026-07-28.

## Tracking
GitHub issue: https://github.com/loewesolucoes/gestao-financeira/issues/43
Related specs: None

## Problem statement
Today `/caixa` shows the accumulated cash balance ("Valor em caixa", the sum
of every `transacoes` row ever entered) and `/patrimonio` shows, per month,
the sum of that month's `patrimonio` entries ("Soma de todos os saldos" in
`PatrimonioTotaisDoMes`, `src/app/caixa/components/patrimonio-totais-do-mes.tsx`).
Nothing today puts these two numbers side by side. A user tracking both net
worth (assets: accounts, investments, etc., entered monthly in
`/patrimonio`) and day-to-day cash flow (`/caixa`) has no quick way to see
how far apart the two are — e.g. money held in investments/assets that
never passed through `transacoes`, or a `patrimonio` update that's out of
sync with the recorded cash flow.

### Why this is a problem
- Issue #43 explicitly asks for a component showing this difference.
- Spotting a large or growing gap is a useful sanity check: it can reveal
  unrecorded transactions, forgotten manual patrimônio entries, or assets
  that should be reconciled.
- Both pages already show one half of the comparison in isolation
  (`/caixa`'s header "Valor em caixa"; each `/patrimonio` month's "Soma de
  todos os saldos"), but never the delta between them.

## Goals
1. Show a single, always-visible card (independent of the selected período)
   on `/caixa` with the difference between the current total patrimônio and
   the current total saldo no caixa.
2. Show the same card on `/patrimonio`.
3. Define the comparison as: **saldo no caixa** = total acumulado histórico
   of `transacoes` (the same value as `/caixa`'s existing "Valor em caixa",
   from `TransacoesRepository`); **patrimônio** = the snapshot total of the
   most recent month registered in `/patrimonio` (sum of that month's
   `patrimonio` rows), not a sum across all historical months.
4. Visually communicate the sign of the difference (patrimônio acima ou
   abaixo do saldo em caixa) consistent with existing positive/negative
   styling conventions in the app.

## Non-goals
- Per-período/per-month recalculation of the difference — the card always
  shows the current global comparison (latest patrimônio snapshot vs.
  all-time caixa total), regardless of the período filter selected on
  either page.
- Any new chart/graph for historical trend of the difference — this spec is
  a single summary card, not a time series (may be considered in a future
  spec).
- Changes to how `patrimonio`/`transacoes` are recorded or migrated.
- **Not implementing the actual code change in this spec** — this spec (with
  its companion `plan.md`/`tasks.md`) only documents the planned change; the
  actual implementation in `src/app/**` is a follow-up piece of work.

## Constraints (project-specific)
- App is a **static export** (`output: 'export'`), fully client-side,
  offline-first PWA — no server-side code; all persistence goes through the
  existing sql.js-in-a-Web-Worker + localforage stack
  (`repositories/default.ts` / `database-connector.ts`).
- No schema/migration changes are expected — this feature only reads
  existing `transacoes`/`patrimonio` data.
- Monetary values must use **`bignumber.js`**, dates must use **`moment`**.
- UI copy must be in **Brazilian Portuguese (pt-br)**.
- UI must follow existing conventions (Bootstrap 5 + SCSS `card-material-1`
  cards, matching the visual style of "Balanço do mês"
  (`caixa-totais-do-mes.tsx`) and "Soma de todos os saldos"
  (`patrimonio-totais-do-mes.tsx`)).
- The new component must be usable from both `/caixa/page.tsx` and
  `/patrimonio/page.tsx` without duplicating logic.

## Acceptance criteria
- [ ] `/caixa` shows a card with the difference between the latest
      patrimônio snapshot and the all-time saldo no caixa, positioned in the
      page's top summary area (near "Valor em caixa"), regardless of the
      período filter.
- [ ] `/patrimonio` shows the same card, in an equivalent top summary area
      (to be added to that page, mirroring `/caixa`'s header pattern).
- [ ] The card correctly reflects sign (patrimônio maior ou menor que o
      caixa) via distinct styling (e.g. `text-success`/`text-danger`,
      consistent with other positive/negative amount styling already used
      in the app).
- [ ] Works correctly when there is no `patrimonio` data yet (empty state,
      no crash — e.g. shows "Sem dados de patrimônio" or treats as zero,
      to be decided in `plan.md`).
- [ ] `npm run lint` and `npm test` (including new tests) pass once
      implemented.

## Future ideas (documented only — not implemented by this spec)
- Historical chart of the patrimônio-vs-caixa gap over time (per month),
  instead of only the current snapshot.
- Configurable threshold/alert when the gap exceeds a user-defined amount.
