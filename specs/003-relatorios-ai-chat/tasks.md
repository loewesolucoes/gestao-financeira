# Tasks: Relatórios AI Chat (Gemini + RAG via SQL)

Checklist for implementing `spec.md` / `plan.md`. Work top to bottom; each task should be a small, reviewable commit.

- [ ] **T1 — Add `GOOGLE_GENERATIVE_AI_API_KEY` parameter**
  - In `src/app/repositories/parametros.ts`, add `export const GOOGLE_GENERATIVE_AI_API_KEY = 'GOOGLE_GENERATIVE_AI_API_KEY';` (same name as in `ai-translate`).
  - Register it in `loadParamsOrDefault()` with an empty default value, mirroring the existing `GOOGLE_DRIVE_REFRESH_TOKEN` handling.
  - No new UI needed — it will show up in the existing generic Parâmetros selector on `/configuracoes`.

- [ ] **T2 — Build the read-only SQL guard**
  - Create `src/app/utils/sql-query-guard.ts` exporting `sanitizeReadOnlyQuery(sql: string): string`.
  - Enforce: single statement, must start with `SELECT`/`WITH`, no DML/DDL/PRAGMA/ATTACH keywords, referenced tables limited to `transacoes`, `patrimonio`, `metas`, `notas`, `categoria_transacoes` (explicitly reject `parametros`/`migrations`), auto-append `LIMIT 200` if missing.
  - Unit tests in `src/app/utils/__tests__/sql-query-guard.test.ts` covering valid and every rejection case above.

- [ ] **T3 — Expose a read-only query execution path on the repository layer**
  - Add `runReadOnlyQuery(sql)` (on `DefaultRepository` or a small dedicated helper reused by the AI context) that calls `sanitizeReadOnlyQuery`, executes via the existing `db.exec`, and serializes the result to plain JSON (`BigNumber` → number, `Date` → ISO string) suitable for returning as a tool result.
  - On guard/execution failure, return a structured error object instead of throwing, so the calling tool loop can hand the error back to the model.

- [ ] **T4 — Add build/tooling support for `.md` prompt imports and AI SDK dependencies**
  - Add `@ai-sdk/google` and `ai` to `dependencies` in `package.json` (versions aligned with `ai-translate`: `@ai-sdk/google@^1.2.22`, `ai@^4.3.19`, adjusting if newer compatible versions are preferred at implementation time).
  - Add `raw-loader` to `devDependencies`; add `zod` as a direct dependency if not already resolvable transitively.
  - Add `{ test: /\.md$/, use: ["raw-loader"] }` to the `webpack()` config in `next.config.js`.
  - Create `global.d.ts` at the `src/app` root (or wherever TS module resolution expects it) with `declare module "*.md" { const content: string; export default content; }`, copied from `ai-translate`.
  - Run `npm install` and confirm `npm run build` still produces a static export successfully.

- [ ] **T5 — Write the system prompt**
  - Create `src/app/prompts/relatorios-chat.md` (pt-br): assistant role/persona, schema description of the five allowed tables (columns + meaning, monetary values as plain numbers, dates as ISO strings), explicit instruction to always use the `consultarBancoDados` tool for any numeric/factual answer (never invent figures), and to respond in Brazilian Portuguese.

- [ ] **T6 — Build `contexts/ai.tsx` (`AiProvider` / `useAi`)**
  - Model it on `ai-translate`'s `contexts/ai.tsx`: load the API key via `repository.params.getValorByKey(GOOGLE_GENERATIVE_AI_API_KEY)` once `isDbOk`, lazily create/cache a `createGoogleGenerativeAI({ apiKey })` client.
  - Add `askRelatoriosChat(messages)` using `generateText`/`streamText` from `ai` with `model: google('gemini-2.5-flash')`, `system` from `prompts/relatorios-chat.md`, a `consultarBancoDados` tool (via `tool()` + `zod` schema `{ sql: string }`, `execute` calling `repository.runReadOnlyQuery`), and a step cap (`stopWhen`/`maxSteps`, whichever the installed SDK version requires) to bound tool-call round-trips.
  - Route errors (missing/invalid key, quota, network) through `NotificationUtil`, matching the sibling repo's error-handling style.
  - Register `<AiProvider>` inside `<StorageProvider>` in `src/app/contexts/index.tsx`.

- [ ] **T7 — Build the chat component**
  - Create `src/app/relatorios/components/chat-ia.tsx`: ephemeral `messages`/`input`/`isLoading` state, a pt-br notice (linking to Configurações) when no API key is set, textarea + send button (Enter to send, Shift+Enter newline), `Loader` while waiting, and a "Limpar conversa" reset button.
  - Style chat bubbles using existing Bootstrap/SCSS conventions.

- [ ] **T8 — Wire the chat into the Relatórios page**
  - Update `src/app/relatorios/page.tsx` to replace the "página em construção" placeholder with a short intro and a `card` containing `<ChatIA />`.
  - Update `src/app/relatorios/page.scss` with any chat-specific styles.

- [ ] **T9 — Automated tests**
  - `contexts/__tests__/ai.test.tsx`: mock `ai`/`@ai-sdk/google`; verify no call is made without a key, correct `system`/`tools`/`messages` wiring, and error routing to `NotificationUtil`.
  - `relatorios/components/__tests__/chat-ia.test.tsx`: mock `useStorage`/`useAi`; verify the missing-key notice, a successful send/response flow, loading state, and the clear-conversation button.

- [ ] **T10 — Manual verification**
  - Configure a real Google Generative AI API key via `/configuracoes` → Parâmetros.
  - On `/relatorios`, ask a question whose correct answer requires querying `transacoes` (e.g. total spent in a specific month) and confirm the answer matches the real data.
  - Attempt to coax the model into querying `parametros` or performing a write, and confirm the guard blocks it and the chat still recovers with a sensible answer/error instead of crashing.

- [ ] **T11 — Lint/build/test gate**
  - Run `npm run lint` and `npm test` (full suite) and confirm everything passes before merging.

## Out of scope (future follow-ups, not part of this work)
- Persisting chat history (new SQLite table, included in DB export/import/Google Drive backup).
- Supporting additional/alternate Gemini models or letting the user pick the model via a Parâmetro.
- A generic, app-wide AI assistant beyond the `/relatorios` chat.
- Write access (INSERT/UPDATE/DELETE) for the model's tool.
