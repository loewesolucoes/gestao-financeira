# Spec: <Nome da feature>

## Status
`Draft` — not yet started. Captured from a design discussion on <YYYY-MM-DD>.

## Tracking
GitHub issue: _TBD_ (ask the user whether to create one before finishing)
Related specs: <link related specs/NNN-slug/spec.md files here, or "None">

## Problem statement
<What's missing/broken today, described from the user's point of view.
Reference concrete files/pages where relevant (e.g. `src/app/<feature>/page.tsx`).>

### Why this is a problem
- <bullet 1>
- <bullet 2>

## Goals
1. <Concrete, testable goal>
2. <...>

## Non-goals
- <Explicitly out of scope for this iteration>
- **Not implementing the actual code change in this spec** — this spec (with
  its companion `plan.md`/`tasks.md`) only documents the planned change; the
  actual implementation in `src/app/**` is a follow-up piece of work.

## Constraints (project-specific)
- App is a **static export** (`output: 'export'`), fully client-side,
  offline-first PWA — no server-side code; all persistence goes through the
  existing sql.js-in-a-Web-Worker + localforage stack
  (`repositories/default.ts` / `database-connector.ts`).
- New tables must be added via the existing migrations mechanism (guarded
  `if (migrations['name'] == null) { ...; migrations['name'] = true }` blocks
  in `runMigrations()` in `src/app/repositories/default.ts`), unless a newer
  per-repository migration mechanism has landed by implementation time.
- Monetary values must use **`bignumber.js`**, dates must use **`moment`**.
- UI copy must be in **Brazilian Portuguese (pt-br)**.
- UI must follow existing conventions (Bootstrap 5 + SCSS, shared `Modal`/
  `Input` components, `page.tsx`/`page-component.tsx`/`components/` layout).
- <Add any feature-specific constraints here>

## Acceptance criteria
- [ ] <Testable criterion>
- [ ] `npm run lint` and `npm test` (including new tests) pass once implemented.

## Future ideas (documented only — not implemented by this spec)
- <Optional: ideas explicitly deferred to a future spec>
