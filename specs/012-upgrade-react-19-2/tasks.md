# Tasks: Atualizar React para a última versão 19.x

Checklist for implementing `spec.md` / `plan.md`. Work top to bottom; each
task should be a small, reviewable commit.

- [ ] **T1 — Check latest published versions**
  - Run `npm view react version`, `npm view react-dom version`,
    `npm view @types/react version`, `npm view @types/react-dom version` to
    confirm the exact `19.2.x` target versions at implementation time
    (newer patches may exist by then).

- [ ] **T2 — Bump `react`/`react-dom`**
  - `npm install react@<version> react-dom@<version>` (exact pins, matching
    the repo's existing style of no `^`/`~` ranges).

- [ ] **T3 — Bump `@types/react`/`@types/react-dom`**
  - `npm install -D @types/react@<version> @types/react-dom@<version>`.
  - Update the `overrides` block in `package.json` to the same versions.

- [ ] **T4 — Lint/build/test gate**
  - Run `npm run lint`, `npm test`, and `npm run build`; fix any fallout
    strictly caused by the version bump (do not refactor unrelated code).

- [ ] **T5 — Manual smoke test**
  - `npm run dev`; click through `caixa`, `metas`, `patrimonio`,
    `emprestimos`, `relatorios`, `notas`, `configuracoes`, `faq`; confirm
    forms/modals open and submit, charts render, and the sql.js-backed data
    layer reads/writes correctly.
  - Verify PWA offline fallback (`src/app/offline`) still triggers after a
    production build (`npm run build` + serve `out/`).

- [ ] **T6 — Update `README.md` release checklist reference (if versions are
      called out there)**
  - Check `README.md` for any hardcoded React version mentions and update
    them if present; otherwise skip.

- [ ] **T7 — Lint/build/test gate (final)**
  - Re-run `npm run lint` and `npm test` (full suite) after all changes and
    confirm everything passes before merging.

## Out of scope (future follow-ups, not part of this work)
- Adopting `<Activity/>`, `useEffectEvent`, or `ViewTransition` in app code.
- Enabling the React Compiler.
- Any Next.js version changes — tracked separately in
  `specs/013-upgrade-nextjs-16/`.
