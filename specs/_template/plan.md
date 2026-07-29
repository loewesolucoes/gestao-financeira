# Plan: <Nome da feature>

Companion technical design for `spec.md`. Describes the target data model,
repository methods, file layout, and testing strategy.

## Data model
<New tables/columns, or "No schema changes" if none. Use a markdown table per
table: column | type | notes. Follow existing `DEFAULT_MAPPING` conventions
(BigNumber for money via MapperTypes.NUMBER/DATE_TIME/BOOLEAN as applicable).>

## Migration
<Guarded migration block(s) for `runMigrations()` in
`src/app/repositories/default.ts`, or "No migration needed". Add new
`TableNames` enum entries if applicable.>

## Repository (`src/app/repositories/<nome>.ts`)
<New/changed repository class extending `DefaultRepository`, interfaces,
enums, and method signatures with a one-line comment each.>

## Registering the repository (`src/app/contexts/storage.tsx`)
<One-line pattern: add to `Repo` interface + instantiate in `startStorage()`,
same as `metas`/`notas`/`patrimonio` — or "No new repository to register".>

## Target file layout
```
src/app/
  repositories/
    <novo-arquivo>.ts
  <feature>/
    page.tsx
    components/
      <componente>.tsx
      __tests__/
        <componente>.test.tsx
```

## UI design
<Which existing page/component pattern this follows (e.g. `metas/page.tsx`
list+modal vs `caixa`'s month-navigation), colors/states, empty states, etc.>

## Testing strategy
<List the new/changed test files and what each should cover.>

## Rollout / risk mitigation
1. <Land schema + repository + tests first, since it's fully unit-testable>
2. <Build UI next>
3. <Manual verification checklist before considering the feature done>
