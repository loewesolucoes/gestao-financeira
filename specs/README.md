# SDD (Spec-Driven Development) in this repo

This folder holds planning docs for features/refactors, written **before**
any implementation code. Each spec is a self-contained folder:

```
specs/NNN-kebab-slug/
  spec.md   # problem, goals, non-goals, constraints, acceptance criteria
  plan.md   # technical design: data model, repository, file layout, testing
  tasks.md  # ordered, checkable implementation checklist
```

## Numbering
`NNN` is a zero-padded, monotonically increasing number: one more than the
highest existing spec folder (see current folders in this directory for the
next free number). The slug is a short kebab-case description of the feature.

## Lifecycle
1. **Draft** — spec/plan/tasks created and captured here; nothing implemented
   yet. A GitHub issue should generally back each spec (the SDD process
   always asks whether to create one — see
   `.github/instructions/sdd.instructions.md`).
2. **Implementation** — a separate, later piece of work follows `tasks.md`
   top to bottom. Creating SDD files and implementing the feature are
   deliberately separate passes.
3. Update `spec.md`'s `Status`/`Tracking` sections as the issue/PR progress.

## Templates
Start any new spec from `specs/_template/` (`spec.md`, `plan.md`, `tasks.md`)
— it mirrors the headers already used by every spec in this folder, so
drafting is fill-in-the-blanks rather than composing from scratch.

## Process rules
The full set of rules the agent follows when asked to create SDD files
(numbering, cross-linking related specs, when to ask about a GitHub issue,
scope boundaries) lives in `.github/instructions/sdd.instructions.md`, which
is automatically applied whenever work touches this folder.
