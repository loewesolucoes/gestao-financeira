---
applyTo: "specs/**"
---

# SDD (spec-driven development) process rules

These rules apply whenever creating or updating files under `specs/`.
See `specs/README.md` for the human-readable overview and
`specs/_template/` for the file skeletons to start from.

## Structure
- Every spec lives in its own folder: `specs/NNN-kebab-slug/`.
- `NNN` = highest existing spec number + 1, zero-padded to 3 digits. Check
  existing folders under `specs/` to find the next number — never reuse or
  renumber an existing spec.
- Every spec folder has exactly three files: `spec.md`, `plan.md`,
  `tasks.md`. Start from `specs/_template/` for the section headers instead
  of composing them from scratch.

## Cross-linking
- Always check existing specs for overlap/dependency and list them under
  `spec.md`'s `## Tracking` → `Related specs`, with a one-line note on the
  relationship (e.g. "new migrations should follow whatever mechanism spec
  001 introduces, if it has landed by then").
- If a new spec changes something a prior spec's "Future ideas" section
  anticipated, link back to it.

## GitHub issues
- **Always ask the user whether to create a GitHub issue** for a new spec
  before considering the SDD files finished (use `gh issue create` if they
  say yes). Link the resulting issue number/URL into `spec.md`'s
  `## Tracking` → `GitHub issue`. If they decline, leave it as `_TBD_`.
- If related specs already have issues, consider linking them to each other
  (e.g. in the issue body or as a comment) when the user asks for that.

## Scope boundary
- An SDD session's job is to produce/update `spec.md`/`plan.md`/`tasks.md`
  only. Do not implement the feature's actual code in `src/app/**` in the
  same pass unless the user explicitly asks for implementation, not just
  planning.

## Style
- Keep prose concise; prefer bullet lists, tables, and checklists over
  paragraphs.
- Reuse the project-specific constraints already spelled out in
  `specs/_template/spec.md` (static export, sql.js/localforage persistence,
  bignumber.js/moment, pt-br UI copy, existing component conventions) rather
  than re-deriving them — copy and adapt, don't rewrite from first
  principles.
