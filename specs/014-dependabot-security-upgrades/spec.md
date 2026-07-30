# Spec: Corrigir alertas do Dependabot (exceto React/Next.js)

## Status
`Draft` — not yet started. Captured from a design discussion on 2026-07-29.

## Tracking
GitHub issue: _TBD_ (ask the user whether to create one before finishing)
Related specs:
- `specs/012-upgrade-react-19-2/spec.md` — cobre os alertas de `react`/
  `react-dom`/`@types/react*`. **Fora do escopo aqui.**
- `specs/013-upgrade-nextjs-16/spec.md` — cobre os alertas de `next` (RCE,
  SSRF, DoS, cache poisoning, XSS) e `eslint-config-next` (a versão desse
  pacote é decidida por essa spec, não pela 014). **Fora do escopo aqui.**
- `specs/002-github-actions-ci-cd/spec.md` — o gate de `npm run lint`/
  `npm test`/`npm run build` no CI (`ci.yml`) é o mecanismo que valida cada
  bump desta spec antes do merge.

## Problem statement
A aba "Security" do repositório (`loewesolucoes/gestao-financeira`) lista 88
alertas abertos do Dependabot em `package-lock.json`. As specs 012 e 013 já
cobrem o maior cluster (`next`, `react`, `react-dom`, `eslint-config-next`).
Esta spec cobre o restante dos alertas, agrupados pelo pacote raiz:

- **`dompurify` (dependência direta, `3.2.6`)** — ~20 alertas, principalmente
  variações de "mutation-XSS via Re-Contextualization" e bypass de
  sanitização (severidade Moderate).
- **`lodash`** (transitiva) — Code Injection via `_.template` imports de
  nomes de chave; Prototype Pollution via bypass de array path em `_.unset`/
  `_.omit`.
- **`immutable`** (transitiva, provável via `jest`/`jest-worker`) — Prototype
  Pollution (High).
- **`js-cookie` (dependência direta, `3.0.5`, severidade baixa)**.
- **Long tail de dependências transitivas de build/dev-tooling** — `glob`,
  `ws`, `form-data`, `flatted`, `svgo`, `serialize-javascript`, `minimatch`,
  `brace-expansion`, `js-yaml`, `postcss`, `webpack`, `picomatch`, `nanoid`,
  `@tootallnate/once`, `@babel/core`, `@babel/runtime`,
  `@babel/plugin-transform-modules-systemjs`, `sharp` — puxadas por
  `devDependencies` como `jest`, `@playwright/test`, `gh-pages`,
  `serwist`/`@serwist/next`, `@svgr/webpack`, `ts-node`, `sass`,
  `autoprefixer`. Nenhuma delas é enviada ao bundle do navegador (são
  ferramentas de build/test), então o risco de regressão é baixo, mas a
  correção exige atualizar os pacotes-pai que as declaram.

### Why this is a problem
- Alertas de severidade Moderate/High acumulados no `package-lock.json`
  ficam visíveis no Security tab e em qualquer scan automatizado de terceiros
  (ex.: auditorias, CI de segurança de parceiros).
- `dompurify` é usado para sanitizar conteúdo (ex. Markdown renderizado via
  `marked`/`easymde`) — um bypass de sanitização é uma superfície de XSS real
  mesmo em um app client-only.
- Pacotes de dev-tooling desatualizados tendem a acumular mais alertas com o
  tempo e tornam upgrades futuros mais arriscados (saltos de versão maiores).

## Goals
1. Atualizar `dompurify` (dependência direta) para a última versão `3.x`
   que corrige os alertas de mutation-XSS, sem quebrar a sanitização de
   Markdown usada em `md-text-area`/renderização de notas.
2. Atualizar `js-cookie` (dependência direta) para a última versão `3.x`
   sem breaking changes de API.
3. Atualizar as `devDependencies` que carregam `lodash`, `immutable`, `glob`,
   `ws`, `form-data`, `flatted`, `svgo`, `serialize-javascript`, `minimatch`,
   `brace-expansion`, `js-yaml`, `postcss`, `webpack`, `picomatch`, `nanoid`,
   `@tootallnate/once` e `@babel/*` (via `jest`, `@playwright/test`,
   `gh-pages`, `serwist`/`@serwist/next`, `@svgr/webpack`, `ts-node`, `sass`,
   `autoprefixer`) para versões que resolvam os alertas correspondentes,
   sem alterar comportamento de build/test.
4. Confirmar que `npm run lint`, `npm test` (Jest) e `npm run build`
   continuam passando sem alterações de código após cada grupo de bump.
5. Reduzir a contagem de alertas abertos do Dependabot ao mínimo possível
   (idealmente zero fora do que 012/013 já cobrem), documentando qualquer
   alerta sem correção disponível.

## Non-goals
- Atualizar `next`, `react`, `react-dom`, `@types/react*` ou
  `eslint-config-next` — coberto por `specs/012-upgrade-react-19-2/` e
  `specs/013-upgrade-nextjs-16/`.
- Adotar novas APIs ou features das ferramentas atualizadas (ex. novos
  recursos do Playwright, Jest, Serwist) — apenas o bump de versão para
  resolver os alertas.
- Reescrever a lógica de sanitização de Markdown/HTML do app — apenas
  atualizar a versão do `dompurify`.
- **Not implementing the actual code change in this spec** — esta spec (com
  seu `plan.md`/`tasks.md`) apenas documenta o trabalho planejado; a
  implementação real (editar `package.json`, rodar `npm install`/
  `npm audit fix`) é um trabalho de acompanhamento separado.

## Constraints (project-specific)
- App é uma **static export** (`output: 'export'`), totalmente client-side,
  PWA offline-first — nenhuma das dependências desta spec introduz código
  server-side.
- Persistência continua via sql.js-in-a-Web-Worker + localforage
  (`repositories/default.ts` / `database-connector.ts`) — nenhuma dessas
  libs (dompurify, js-cookie, lodash, etc.) faz parte dessa stack; bumps não
  devem exigir mudanças de schema/migração.
- Monetary values usam **`bignumber.js`**, datas usam **`moment`** —
  não afetado por esta spec.
- UI copy deve permanecer em **pt-br** — não afetado.
- `dompurify` é usado para sanitizar HTML/Markdown renderizado no app (ex.
  notas, `md-text-area.tsx`) — qualquer bump deve manter o comportamento de
  sanitização atual (nenhuma tag/atributo previamente bloqueado deve passar
  a ser permitido sem uma decisão explícita).
- `js-cookie` é usado onde cookies são lidos/escritos no client (ex. fluxo de
  auth com Google Drive) — API pública (`Cookies.get`/`Cookies.set`) deve
  continuar estável na versão nova.
- CI (`ci.yml`, ver spec 002) roda `npm ci`, `npm run lint`, `npm test`,
  `npm run build` em todo PR para `main` — qualquer bump desta spec deve
  passar nesse gate.

## Acceptance criteria
- [ ] `dompurify` atualizado para a última `3.x` disponível; alertas de
      mutation-XSS relacionados fecham no Security tab após o merge.
- [ ] `js-cookie` atualizado para a última `3.x` disponível.
- [ ] `jest`, `@playwright/test`, `gh-pages`, `serwist`/`@serwist/next`,
      `@svgr/webpack`, `ts-node`, `sass`, `autoprefixer` atualizados (ou
      `npm audit fix`/`package-lock.json` regenerado) de forma a não haver
      mais versões vulneráveis de `lodash`, `immutable`, `glob`, `ws`,
      `form-data`, `flatted`, `svgo`, `serialize-javascript`, `minimatch`,
      `brace-expansion`, `js-yaml`, `postcss`, `webpack`, `picomatch`,
      `nanoid`, `@tootallnate/once`, `@babel/*` no `package-lock.json`.
- [ ] `npm run lint` e `npm test` (suíte completa) passam sem alterar
      arquivos de teste/mocks existentes.
- [ ] `npm run build` produz um export estático funcional em `out/`.
- [ ] Teste manual: notas/Markdown com HTML embutido continuam sendo
      sanitizadas conforme esperado após o bump do `dompurify`; fluxo de
      auth com Google Drive (cookies) continua funcionando.
- [ ] Contagem de alertas abertos do Dependabot (excluindo os cobertos por
      012/013) reduzida ao mínimo possível; qualquer alerta remanescente sem
      correção disponível é documentado em `plan.md`/`tasks.md` com o motivo.

## Future ideas (documented only — not implemented by this spec)
- Automatizar um Dependabot "grouped update" (via `.github/dependabot.yml`)
  para agrupar bumps de patch/minor por ecossistema e reduzir o número de
  PRs individuais no futuro.
- Avaliar substituir `dompurify` por uma solução de sanitização mantida com
  cadência de patch mais previsível, se os alertas voltarem a se acumular.
