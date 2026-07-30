# Tasks: Corrigir alertas do Dependabot (exceto React/Next.js)

Checklist para implementar `spec.md` / `plan.md`. Trabalhar de cima para
baixo; cada tarefa deve ser um commit pequeno e revisável, com seu próprio
gate de lint/test/build antes de passar para a próxima.

- [ ] **T1 — Levantamento atualizado dos alertas**
  - Reabrir a aba Security → Dependabot alerts e conferir a lista atual
    (pode ter mudado desde que esta spec foi escrita). Confirmar que os
    pacotes listados em `spec.md` ainda são os mesmos; anotar quaisquer
    alertas novos/fechados.

- [ ] **T2 — Grupo A: bump `js-cookie`**
  - Atualizar `js-cookie` (`dependencies`) e `@types/js-cookie`
    (`devDependencies`) para a última `3.x`.
  - Buscar usos de `Cookies.get`/`Cookies.set`/`Cookies.remove` no repo e
    confirmar que a API não mudou.
  - Rodar `npm install`, `npm run lint`, `npm test`, `npm run build`.

- [ ] **T3 — Grupo C: `npm outdated` + atualização de dev-tooling**
  - Rodar `npm outdated` para `jest`, `jest-environment-jsdom`,
    `@playwright/test`, `gh-pages`, `serwist`, `@serwist/next`,
    `@svgr/webpack`, `ts-node`, `sass`, `autoprefixer`.
  - Atualizar cada um para a última versão compatível, checando changelogs
    de breaking changes.

- [ ] **T4 — Grupo C: regenerar lockfile e confirmar remediação**
  - Rodar `npm install` e `npm audit` (ou revisar a aba Dependabot) para
    confirmar que `lodash`, `immutable`, `glob`, `ws`, `form-data`,
    `flatted`, `svgo`, `serialize-javascript`, `minimatch`,
    `brace-expansion`, `js-yaml`, `postcss`, `webpack`, `picomatch`,
    `nanoid`, `@tootallnate/once`, `@babel/*` não aparecem mais em versões
    vulneráveis.
  - Para qualquer pacote que persista vulnerável sem bump de pai disponível,
    avaliar `overrides` no `package.json` (documentar a decisão aqui).

- [ ] **T5 — Grupo C: verificação**
  - Rodar `npm run lint`, `npm test` (suíte completa), `npm run build`, e
    `npm run test:e2e` (Playwright) se o ambiente permitir.
  - Confirmar que o PWA/service worker (Serwist) ainda gera `sw.js`
    corretamente após o bump de `serwist`/`@serwist/next`.

- [ ] **T6 — Grupo B: bump `dompurify`**
  - Atualizar `dompurify` para a última `3.x` disponível.
  - Localizar todos os usos de `DOMPurify.sanitize(...)` no repo (ex.
    `src/app/components/md-text-area.tsx` e/ou renderização de notas) e
    revisar a config de allowlist de tags/atributos.

- [ ] **T7 — Grupo B: teste de regressão de sanitização**
  - Adicionar (ou confirmar existente) um teste unitário que sanitiza um
    payload malicioso simples (ex. `<img src=x onerror=alert(1)>`) e valida
    que o output continua sanitizado após o bump.

- [ ] **T8 — Grupo B: verificação e teste manual**
  - Rodar `npm run lint`, `npm test`, `npm run build`.
  - Teste manual: abrir uma nota com Markdown/HTML embutido no app rodando
    localmente e confirmar que a sanitização continua funcionando como
    esperado.

- [ ] **T9 — Re-checar alertas do Dependabot**
  - Voltar à aba Security → Dependabot alerts e confirmar que os alertas
    cobertos por esta spec (fora do escopo de 012/013) fecharam.
  - Documentar aqui qualquer alerta remanescente sem correção disponível e
    o motivo (ex. "sem versão corrigida publicada ainda").

- [ ] **T10 — Lint/build/test gate final**
  - Rodar `npm run lint` e `npm test` (suíte completa) uma última vez com
    todas as mudanças combinadas, e confirmar que o CI (`ci.yml`) passa no
    PR antes do merge.

## Out of scope (future follow-ups, not part of this work)
- Automatizar Dependabot "grouped updates" via `.github/dependabot.yml`
  para reduzir o número de PRs individuais futuros.
- Avaliar substituir `dompurify` por outra solução de sanitização se os
  alertas voltarem a se acumular com frequência.
- Bump de `next`/`react`/`react-dom`/`eslint-config-next` — ver
  `specs/012-upgrade-react-19-2/` e `specs/013-upgrade-nextjs-16/`.
