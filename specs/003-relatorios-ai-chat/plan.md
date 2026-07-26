# Plan: Relatórios AI Chat (Gemini + RAG via SQL)

Companion technical design for `spec.md`. Describes the target file layout, integration approach, and how it reuses the pattern already proven in the sibling repo `ai-translate` (`C:\codigos\ai-translate`, same Next.js/sql.js/localforage stack).

## Key discovery: reuse the `ai-translate` integration pattern
`ai-translate` already integrates the Google Generative AI API client-side, via the Vercel AI SDK (`ai` + `@ai-sdk/google`), **not** raw `fetch` calls to the Generative Language REST API. We adopt the same approach here instead of hand-rolling REST/function-calling plumbing:

- Dependencies: `@ai-sdk/google` (`^1.2.22`) + `ai` (`^4.3.19`).
- `repositories/parametros.ts` gains `export const GOOGLE_GENERATIVE_AI_API_KEY = 'GOOGLE_GENERATIVE_AI_API_KEY';` — same constant name used in `ai-translate` — registered in `loadParamsOrDefault()` with an empty default, exactly like `GOOGLE_DRIVE_REFRESH_TOKEN` is today.
- A new `contexts/ai.tsx` (`AiProvider`/`useAi()`), modeled on `ai-translate`'s `contexts/ai.tsx`: loads the API key from the parameter once `isDbOk`, lazily creates a singleton client via `createGoogleGenerativeAI({ apiKey })` (cached on `window.__google`, matching the sibling repo's technique), and exposes an async function to run a chat turn.
- System prompts as `.md` files imported directly (e.g. `src/app/prompts/relatorios-chat.md`), requiring the same build changes already present in `ai-translate` but missing here today:
  - `next.config.js`: add `{ test: /\.md$/, use: ["raw-loader"] }` to the webpack config.
  - `global.d.ts` (new file): `declare module "*.md" { const content: string; export default content; }`.
  - `raw-loader` added as a devDependency.
- Registered in `contexts/index.tsx`, nested inside `<StorageProvider>` (it depends on `repository.params`).

### Key difference from `ai-translate`
`ai-translate`'s `fetchAiData` only does plain `streamText` with a system/user prompt (no tools) — used for one-shot translation help. Here we need **multi-turn tool calling** so the model can decide to run SQL queries mid-conversation before producing a final answer. The Vercel AI SDK (`ai` package) supports this natively via `tools` + `stopWhen`/`maxSteps` (exact option name depends on the installed `ai` version — verify against the `ai@4.3.19`/`@ai-sdk/google@1.2.22` versions already pinned in `ai-translate`, or whatever version ends up installed here) on `generateText`/`streamText`.

## Target file layout

```
src/app/
  contexts/
    ai.tsx                              # AiProvider / useAi (new)
  prompts/
    relatorios-chat.md                  # system prompt (new)
  relatorios/
    page.tsx                            # updated: renders <ChatIA /> in a card
    page.scss                           # updated: chat bubble styles
    components/
      chat-ia.tsx                       # new chat component
      __tests__/
        chat-ia.test.tsx
  repositories/
    parametros.ts                       # updated: GOOGLE_GENERATIVE_AI_API_KEY constant
    default.ts                          # updated: runReadOnlyQuery() (or a thin wrapper repo)
  utils/
    sql-query-guard.ts                  # new: sanitizeReadOnlyQuery()
    __tests__/
      sql-query-guard.test.ts
global.d.ts                             # new: declare module "*.md"
next.config.js                          # updated: webpack rule for .md
```

## Read-only SQL guard (`utils/sql-query-guard.ts`)
A pure function `sanitizeReadOnlyQuery(sql: string): string` (throws on violation) used as the implementation behind the model's tool call:
- Rejects anything not starting with `SELECT`/`WITH` (case-insensitive, trimmed).
- Rejects multiple statements (more than one trailing `;`).
- Rejects DML/DDL/pragma keywords anywhere in the statement: `INSERT`, `UPDATE`, `DELETE`, `DROP`, `ALTER`, `ATTACH`, `PRAGMA`, `VACUUM`, `REPLACE`, `CREATE`.
- Extracts referenced tables (regex over `FROM`/`JOIN` clauses) and rejects any table not in the allowlist `transacoes`, `patrimonio`, `metas`, `notas`, `categoria_transacoes` — explicitly rejecting `parametros` and `migrations` even though they're real tables.
- Appends `LIMIT 200` if no `LIMIT` clause is present, to bound the amount of data returned to the model.

This is intentionally a conservative allowlist/regex-based guard, not a full SQL parser — sufficient because the only caller is a same-origin, single-user, client-side tool loop (not a multi-tenant server endpoint).

## Executing the query against sql.js
Add a thin method on the repository layer — either `DefaultRepository.runReadOnlyQuery(sql)` or a dedicated method used by all repos — that:
1. Calls `sanitizeReadOnlyQuery(sql)`.
2. Executes via the existing `this.db.exec(sql)` (same worker-backed connection every other repository already uses — no second DB connection).
3. Runs the result through `parseSqlResultToObj()` (existing helper) and then serializes it to plain JSON (converting `BigNumber` → `number`/string, `Date` → ISO string) so it can be safely returned as a tool result to the model.
4. On guard rejection or SQL execution error, returns a structured error object (not a thrown exception) so the model can see *why* its query failed and try again within the step budget.

## AI context (`contexts/ai.tsx`)
```ts
askRelatoriosChat(messages, { onError }) // returns { text } or streams
```
- `model: google('gemini-2.5-flash')`.
- `system`: content of `prompts/relatorios-chat.md` — describes the assistant's role (personal finance assistant), the schema of the allowed tables (column names/meaning, `valor` as a plain number, dates as ISO strings), the rule that it must only use the `consultarBancoDados` tool for numbers (never invent totals), and that responses must be in pt-br.
- `messages`: the chat's message history (see UI section).
- `tools: { consultarBancoDados: tool({ description: '...', inputSchema: z.object({ sql: z.string() }), execute: async ({ sql }) => repository.runReadOnlyQuery(sql) }) }` — using the SDK's `tool()` helper and `zod` for the input schema (add `zod` as a direct dependency if not already resolvable transitively through `ai`).
- A step cap (`stopWhen: stepCountIs(6)` or `maxSteps: 6`, whichever the installed SDK version expects) to prevent runaway tool-call loops and bound latency/cost.
- Errors (missing/invalid key, quota, network) are surfaced via the existing `NotificationUtil`, mirroring `ai-translate`'s `ai.tsx`.

## Chat UI (`relatorios/components/chat-ia.tsx`)
- Local state: `messages: { role: 'user' | 'assistant'; content: string }[]`, `input: string`, `isLoading: boolean`.
- Reads `useStorage()` to check whether `GOOGLE_GENERATIVE_AI_API_KEY` is set (via `repository.params.getValorByKey`); if empty, renders a pt-br notice linking to Configurações instead of enabling the input.
- Uses `useAi()`'s `askRelatoriosChat` to send the full message history plus the new user message, appends the assistant's final answer to state when the call resolves.
- UI built from existing Bootstrap conventions already used across the app (`card`, `card-body`, `form-control`), a textarea + send button (Enter to send, Shift+Enter for newline), the existing `Loader` component while waiting, and a "Limpar conversa" button that simply resets local state (consistent with the ephemeral, non-persisted design).

## Relatórios page (`relatorios/page.tsx` + `page.scss`)
- Replace the placeholder paragraph with a short explanation of the feature and a `card` wrapping `<ChatIA />`, following the visual pattern of other feature pages (`container`, `card-header`).
- Keep the existing `document.title` effect.

## Testing strategy
- `utils/__tests__/sql-query-guard.test.ts`: valid cases (`SELECT`, `WITH ... SELECT`), rejected cases (DML/DDL keywords, multiple statements, disallowed table, explicit `parametros`/`migrations` reference), and automatic `LIMIT` injection.
- `contexts/__tests__/ai.test.tsx`: mock `ai` and `@ai-sdk/google` (`jest.mock`); assert no model call happens without a configured key, assert `system`/`tools`/`messages` are wired correctly, assert errors are routed to `NotificationUtil`.
- `relatorios/components/__tests__/chat-ia.test.tsx`: mock `useStorage` and `useAi`; assert the "configure a key" notice renders when the key is empty, assert sending a message renders the assistant's reply, assert the loading state and "Limpar conversa" reset behavior.

## Build/tooling changes required
1. `next.config.js`: add `{ test: /\.md$/, use: ["raw-loader"] }` to the existing `webpack()` config (alongside the current `@svgr/webpack` rule and `copy-webpack-plugin` patterns).
2. `global.d.ts` (new, repo root doesn't have one for `src/app` yet): ambient module declaration for `*.md`, copied from `ai-translate`'s `src/app/global.d.ts`.
3. `package.json`: add `@ai-sdk/google`, `ai` as dependencies; `raw-loader` as a devDependency; add `zod` as a direct dependency if it isn't already resolvable as a transitive dependency of `ai`.
4. Verify `npm run build` (static export) still succeeds with the new webpack rule and dependencies — no dynamic/server-only Next.js features are introduced.

## Rollout / risk mitigation
1. Land the query guard and its tests first (`sql-query-guard.ts`) — it's the security-critical piece and is fully unit-testable without any network/model dependency.
2. Verify the exact multi-step tool-calling API (`stopWhen`/`maxSteps` naming, `tool()` signature) against the specific `ai`/`@ai-sdk/google` versions actually installed, since the AI SDK's tool-calling API has changed across major versions — don't assume the same exact call shape as `ai-translate`'s simpler `streamText` usage without tools.
3. Manually test with a real (user-provided) Gemini API key against a populated local DB to confirm grounded answers before considering the feature done — a passing unit test suite alone doesn't prove the RAG loop produces correct financial figures.
4. Keep the feature isolated to `/relatorios` — no shared global chat state or navigation-wide AI affordance is introduced in this iteration.
