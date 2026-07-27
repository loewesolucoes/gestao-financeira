# Spec: Relatórios AI Chat (Gemini + RAG via SQL)

## Status
`Draft` — not yet started. Captured from a design discussion on 2026-07-26.

## Tracking
GitHub issue: _TBD_
Related specs: [001-repository-migrations-refactor](../001-repository-migrations-refactor/spec.md), [002-github-actions-ci-cd](../002-github-actions-ci-cd/spec.md)

## Problem statement
The `/relatorios` page is currently a placeholder — it only renders a "página em construção" message. Users have no way to ask free-form questions about their own financial data (transações, patrimônio, metas, notas, categorias) and get a natural-language answer grounded in that data.

We want to add a chat interface on `/relatorios` backed by a Google Gemini model, where the model can query the user's local SQLite (sql.js) database to ground its answers (a form of RAG), instead of guessing or requiring the user to manually compute totals.

### Why this is a problem
- **No exploratory reporting today** — the only insights available are the fixed views on `caixa`/`home`/`patrimonio`; there's no way to ask an ad-hoc question like "quanto gastei em restaurantes nos últimos 3 meses?".
- **App is client-only** — there is no backend to host a server-side LLM/RAG pipeline; any AI integration must run entirely in the browser, calling the Google Generative Language API directly with a user-supplied key.
- **Data must stay grounded** — an LLM answering purely from a prompt (no access to real numbers) would hallucinate financial figures, which is unacceptable for a finance app.

## Goals
1. Add a chat UI to `/relatorios` where the user can ask questions in Brazilian Portuguese about their financial data.
2. Ground answers in the user's actual local data using a text-to-SQL / tool-calling loop: the Gemini model decides which read-only `SELECT` queries to run against the sql.js database; the app executes them and feeds results back to the model, which then produces a final natural-language answer.
3. Let the user configure their own Google Generative AI API key via the existing **Parâmetros** section of `/configuracoes`, following the same pattern already used for `GOOGLE_DRIVE_REFRESH_TOKEN`.
4. Reuse the integration pattern already proven in the sibling repo `ai-translate` (Vercel AI SDK: `ai` + `@ai-sdk/google`) rather than hand-rolling raw REST calls to the Generative Language API.

## Non-goals
- Not persisting chat history — the conversation is ephemeral (kept only in React state) and is not written to the SQL database, not exported/backed up, and not synced to Google Drive.
- Not adding a generic/reusable "AI assistant" across the whole app in this iteration — scope is limited to the `/relatorios` page chat.
- Not supporting write operations (INSERT/UPDATE/DELETE) via the model — the tool the model can call is strictly read-only.
- Not adding server-side proxying of the API key — the key is stored and used entirely client-side, same trust model already accepted for the Google Drive refresh token.
- Not building a generic query builder UI — the only way to query data is through the model's tool calls, not through manual SQL entry by the user.

## Constraints (project-specific)
- App is a **static export** (`output: 'export'`), fully client-side, offline-except-for-the-AI-call PWA — no server-side code can be introduced; all model calls happen directly from the browser using `fetch`-based SDKs.
- The database is **sql.js running in a Web Worker**, accessed through `DefaultRepository`/`database-connector.ts` — any new read path (running model-generated SQL) must go through this existing worker-based `db.exec` mechanism, not a separate/duplicate DB connection.
- The `parametros` table (and its values, including the new API key and the existing Google Drive refresh token) must **never** be exposed to the model or be a queryable table for the tool-calling loop.
- Model-generated SQL must be constrained to an explicit table allowlist: `transacoes`, `patrimonio`, `metas`, `notas`, `categoria_transacoes`.
- UI copy, error messages, and the system prompt must be in Brazilian Portuguese (pt-br), consistent with the rest of the app.
- `next.config.js` already has custom webpack rules (`@svgr/webpack`, `copy-webpack-plugin` for sql.js WASM) — importing prompt files as raw text (`.md`) requires adding a new webpack rule there, mirroring what `ai-translate` already does with `raw-loader`.

## Acceptance criteria
- [ ] `/configuracoes` → Parâmetros lists a `GOOGLE_GENERATIVE_AI_API_KEY` entry (empty by default) that the user can set, using the existing generic Parâmetros UI (no new UI needed there).
- [ ] `/relatorios` renders a chat card; if no API key is configured, it shows a clear pt-br message pointing the user to Configurações instead of attempting any model call.
- [ ] When a key is configured, the user can type a financial question and receive an answer grounded in real data from their local DB (verified by asking a question whose correct answer requires querying `transacoes`, e.g. total spent in a given month).
- [ ] The model can only run read-only `SELECT`/`WITH` queries against `transacoes`, `patrimonio`, `metas`, `notas`, `categoria_transacoes`; any attempt to reference `parametros`, `migrations`, or to run DML/DDL is rejected before reaching the database, with the rejection surfaced back to the model (not a silent crash).
- [ ] The chat has a bounded number of tool-call round-trips per question (to cap latency/cost) and fails gracefully with a pt-br error message if that bound is exceeded or the API call errors (invalid key, quota, network).
- [ ] Chat history resets on page reload/navigation — nothing related to chat messages is added to the exported/imported DB dump or the Google Drive backup.
- [ ] `npm run lint` and `npm test` (including new tests for the query guard, the AI context, and the chat component) pass.
