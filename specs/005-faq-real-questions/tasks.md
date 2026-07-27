# Tasks: Perguntas reais do FAQ

Checklist for implementing `spec.md` / `plan.md`. Work top to bottom; each task
should be a small, reviewable commit.

- [ ] **T1 — Replace the `qea` array in `src/app/faq/page.tsx`**
  - Swap the current 8 construction-themed entries for the 11 entries drafted in
    `plan.md` (10 new questions about Caixa, Metas, Patrimônio, Empréstimos,
    Relatórios, Notas, armazenamento/privacidade de dados, backup no Google Drive,
    uso offline/PWA, and modo escuro, plus the existing Termos/Política entry kept
    unchanged at the end).
  - Keep the exact JSX shape for each answer as specified in `plan.md` (plain
    `<p className="mw-md mt-4 mb-0">` for items 1–10; unchanged `<span>`/`<ul>`/
    `<Link>` block for item 11).
  - Leave the `// TODO: trocar pra um arquivo markdown` comment and all other code
    in `page.tsx` untouched.

- [ ] **T2 — Manual verification**
  - Run `npm run dev`, open `/faq`, and confirm all 11 questions render, expand/
    collapse correctly on click, and read naturally in pt-br.
  - Confirm the Termos de uso / Política de Privacidade links still navigate
    correctly.

- [ ] **T3 — Add a Jest test for the FAQ page (new, since none exists today)**
  - Create `src/app/faq/__tests__/page.test.tsx` using React Testing Library,
    following the project's colocated `__tests__/*.test.tsx` convention.
  - Render the `FAQ`/`Page` component and assert: the expected number of
    questions render (11), a couple of new representative questions are present
    (e.g. the Caixa and privacy/storage ones), the Termos/Política question is
    present, and clicking a question toggles its `show`/expanded state (assert via
    the answer becoming visible or the `li`'s class change).
  - Mock any context providers the component needs (e.g. wrap with `Layout`'s
    required providers or mock `Layout` itself) consistent with how other page
    tests in this repo stub `src/app/shared/layout.tsx` / contexts.

- [ ] **T4 — Lint and test**
  - Run `npm run lint` and fix any issues.
  - Run `npx jest src/app/faq/__tests__/page.test.tsx` (or `npm test`) and confirm
    it passes.

- [ ] **T5 — Update spec status**
  - Once implemented and verified, update `Status` in `spec.md` from `Draft` to
    `Done` and check off the acceptance criteria and this file's checkboxes.
