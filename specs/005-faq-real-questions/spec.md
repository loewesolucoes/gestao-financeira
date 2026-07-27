# Spec: Perguntas reais do FAQ

## Status
`Draft` — not yet started.

## Tracking
GitHub issue: https://github.com/loewesolucoes/gestao-financeira/issues/8
Related specs: none.

## Problem statement
The FAQ page (`src/app/faq/page.tsx`) hardcodes a `qea` array of question/answer
pairs. All 8 current questions describe a **construction/works-management system**
(orçamento de obra, centro de custo, cotações de fornecedores, portal do cliente,
gestão de funcionários, acompanhamento de obra, integração com RH/suprimentos).
This is unrelated, leftover template content — Gestão Financeira is a **personal
finance / net-worth tracker** with modules for caixa (transações mensais), metas
de economia, patrimônio, empréstimos, relatórios, notas, and optional Google Drive
backup, running entirely client-side (no backend).

### Why this is a problem
- Real users opening `/faq` see questions about a domain (construction management)
  that has nothing to do with the app they are using, which is confusing and looks
  broken/unfinished.
- The one genuinely relevant existing item ("Vocês possuem Termos de uso e Política
  de Privacidade?") is buried among 7 irrelevant ones.
- There is no FAQ coverage today for the app's actual features or for common
  first-time-user concerns (where is my data stored, is it private, does it work
  offline, how do I back it up, is there dark mode, etc.).

## Goals
1. Replace the entire `qea` array in `src/app/faq/page.tsx` with 10–12 new
   question/answer pairs, written in pt-br, that reflect the app's real
   functionality and plausible real user questions.
2. Cover, at minimum, these topics (one question each unless noted):
   - Caixa: how to register monthly income/expenses (transações).
   - Metas: how to create and track savings goals.
   - Patrimônio: how to monitor net worth/assets over time.
   - Empréstimos: how to track loans given or taken.
   - Relatórios: what kind of reports/charts are available.
   - Notas: how to keep finance-related notes.
   - Data storage & privacy: where data is stored (locally in the browser via
     sql.js/localforage, no backend server, no data leaves the device unless the
     user opts into Google Drive backup).
   - Backup/restore: how Google Drive backup works and whether it's mandatory.
   - Offline/PWA usage: whether the app works offline and can be installed as an
     app.
   - Dark mode / theme: how to switch between light and dark mode.
   - Bulk editing (edição em massa) in Caixa (optional, if a 12th question is
     included).
   - Keep the existing "Termos de uso e Política de Privacidade" question/answer
     unchanged (it already links to `/termos-de-uso` and `/politica-de-privacidade`
     via `<Link>` and is still accurate).
3. Preserve the exact list/answer rendering shape used today (`<p className="mw-md
   mt-4 mb-0">...</p>` for plain-text answers; the existing `<span>`/`<ul>`/`<Link>`
   structure for the Termos/Política answer) so styling and collapse/expand
   behavior are unaffected.

## Non-goals
- **Not** changing the FAQ page's component logic, styling (`page.scss`),
  collapse/expand behavior, or the `ArrowIcon`/layout markup — only the `qea`
  content changes.
- **Not** moving the content to a markdown file (the existing `// TODO: trocar pra
  um arquivo markdown` comment is out of scope for this spec; it stays as-is or is
  removed only if trivially so during implementation, but no markdown-loading
  mechanism is introduced).
- **Not** adding new routes, features, or backend/API calls.
- **Not** implementing the actual code change in this spec — this spec (with its
  companion `plan.md`/`tasks.md`) only documents the planned change; the edit to
  `src/app/faq/page.tsx` is a follow-up implementation task.
- **Not** adding i18n/translation infrastructure — content stays hardcoded pt-br,
  consistent with the rest of the app.

## Constraints (project-specific)
- App is localized in pt-br (`<html lang="pt-br">`) — all new question/answer text
  must be in Brazilian Portuguese, consistent with existing tone/style.
- App is client-only, statically exported (`output: 'export'`) — no server-backed
  content or API calls may be introduced; answers describing "where data is stored"
  must accurately reflect the sql.js/localforage/Web Worker architecture (no
  backend, data stays in the browser unless the user backs up to Google Drive).
- Must not misrepresent unfinished features (e.g. `/relatorios` currently may be a
  placeholder per spec `003-relatorios-ai-chat`) — answers must describe only
  functionality that actually exists in the shipped app at implementation time.
- Keep answers concise (similar length to existing ones, ~1–3 sentences) to match
  the FAQ's card-based UI (`btn p-4 ... rounded-4`), which is not designed for long
  paragraphs.
- The Termos de uso / Política de Privacidade question must remain, using the same
  `<Link href="/termos-de-uso">`/`<Link href="/politica-de-privacidade">` pattern.

## Acceptance criteria
- [ ] `specs/005-faq-real-questions/plan.md` lists the final drafted text for every
      new question and answer, ready to be copy-pasted into `qea`.
- [ ] `specs/005-faq-real-questions/tasks.md` provides a step-by-step checklist to
      implement the change and validate it (manual check + lint + tests if
      present).
- [ ] No construction/works-management-themed question remains in the plan's final
      content.
- [ ] The final list has 10–12 items, includes the topics enumerated in Goal 2, and
      keeps the Termos/Política item.
- [ ] The plan preserves the existing answer JSX shape so no styling regressions
      are expected when implemented.
