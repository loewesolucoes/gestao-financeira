# Plan: Corrigir alertas do Dependabot (exceto React/Next.js)

Companion técnico para `spec.md`. Não há mudança de schema/dados — este é um
plano de bump de dependências puro, organizado por grupo de risco.

## Data model
Nenhuma mudança de schema. Nenhuma dessas dependências toca a camada de
persistência (`sql.js`/`localforage`/`repositories/*`).

## Migration
Nenhuma migração necessária.

## Grupos de atualização (ordem de execução sugerida)

### Grupo A — `js-cookie` (direto, baixo risco)
- Bump `js-cookie` de `3.0.5` para a última `3.x`.
- Bump `@types/js-cookie` (devDependency) em conjunto, mesma major.
- Superfície de uso no repo: buscar todos os `import Cookies from 'js-cookie'`
  (provavelmente em `src/app/contexts/auth.tsx` ou similar, fluxo Google
  Drive) e confirmar que a API `Cookies.get`/`Cookies.set`/`Cookies.remove`
  não mudou de assinatura entre versões `3.x`.
- Verificação: `npm run lint`, `npm test`, `npm run build`.

### Grupo B — `dompurify` (direto, risco moderado)
- Bump `dompurify` de `3.2.6` para a última `3.x` disponível (não pular para
  uma major nova se houver breaking changes de API — documentar se for o
  caso).
- Buscar todos os usos de `DOMPurify.sanitize(...)` no repo (provável em
  `src/app/components/md-text-area.tsx` e/ou onde `marked`/HTML de notas é
  renderizado) e confirmar que a config de sanitização (allowlist de
  tags/atributos) continua produzindo a mesma saída para os casos de teste
  existentes.
- Se houver testes unitários cobrindo renderização de Markdown/HTML
  sanitizado, rodá-los como parte da verificação; se não houver, adicionar
  um teste de regressão simples (input com `<script>`/`onerror=` etc. →
  output sanitizado) como parte desta spec, já que é uma dependência de
  segurança direta.
- Verificação: `npm run lint`, `npm test`, `npm run build`, teste manual de
  notas com HTML/Markdown embutido.

### Grupo C — Dev-tooling transitivo (baixo risco de runtime, build-only)
Estes pacotes nunca são enviados ao bundle do navegador — são usados apenas
em build/test/dev. Estratégia: atualizar os `devDependencies`-pai que os
declaram, depois rodar `npm install`/`npm audit fix --production=false` para
regenerar o `package-lock.json` e confirmar que as versões vulneráveis saem
da árvore de dependências.

| Pacote vulnerável (transitivo) | Puxado por (devDependency pai) |
|---|---|
| `lodash`, `immutable` | `jest` (via `jest-worker`/`jest-snapshot` etc.) |
| `glob`, `minimatch`, `brace-expansion`, `picomatch` | `jest`, `@playwright/test`, `ts-node`, `gh-pages` |
| `ws` | `@playwright/test` |
| `form-data` | `gh-pages` (requisições HTTP internas) ou `@playwright/test` |
| `flatted`, `serialize-javascript` | `jest` (serialização de snapshots/config) |
| `svgo` | `@svgr/webpack` |
| `js-yaml` | `eslint`/`jest`/`@playwright/test` (config parsing) |
| `postcss`, `webpack` | `sass`/`autoprefixer`/`serwist`/`@serwist/next` (build de assets/service worker) |
| `nanoid` | `serwist`/`@serwist/next` |
| `@tootallnate/once` | `gh-pages` (proxy HTTP interno) |
| `@babel/core`, `@babel/runtime`, `@babel/plugin-transform-modules-systemjs` | `jest`/`ts-node` (transpilação em testes) |
| `sharp` | possivelmente `@svgr/webpack`/otimização de imagem em dev-tooling |

Passos:
1. Rodar `npm outdated` para ver as versões atuais vs. últimas disponíveis
   de `jest`, `jest-environment-jsdom`, `@playwright/test`, `gh-pages`,
   `serwist`, `@serwist/next`, `@svgr/webpack`, `ts-node`, `sass`,
   `autoprefixer`, `eslint`.
2. Atualizar cada um para a última versão compatível (checar changelog de
   breaking changes, especialmente `jest`/`@playwright/test`, que podem
   mudar comportamento de matchers/config).
3. Rodar `npm install` e depois `npm audit` para confirmar que os pacotes
   vulneráveis da tabela acima não aparecem mais (ou, se ainda aparecerem,
   checar se há um pacote-pai mais novo que os traga corrigidos).
4. Se algum pacote vulnerável persistir sem um bump de pai disponível,
   avaliar `overrides` no `package.json` (mesmo padrão já usado para
   `@types/react`/`@types/react-dom`) como último recurso, documentando o
   motivo.
5. Verificação: `npm run lint`, `npm test` (suíte completa), `npm run build`,
   e um smoke run de `npm run test:e2e` se o ambiente permitir.

## Repository (`src/app/repositories/<nome>.ts`)
Não aplicável — nenhuma mudança de repositório.

## Registering the repository (`src/app/contexts/storage.tsx`)
Não aplicável.

## Target file layout
```
package.json           # version bumps nos grupos A/B/C acima
package-lock.json       # regenerado via npm install/npm audit fix
src/app/components/
  md-text-area.tsx      # revisar uso de DOMPurify (grupo B)
  __tests__/
    md-text-area.test.tsx   # possível novo teste de sanitização (grupo B)
src/app/contexts/
  auth.tsx (ou equivalente)  # revisar uso de js-cookie (grupo A)
```

## UI design
Não aplicável — esta spec não altera UI.

## Testing strategy
- Grupo A: nenhum teste novo esperado (bump de API estável); rodar suíte
  existente.
- Grupo B: adicionar/confirmar um teste de sanitização com
  `DOMPurify.sanitize` cobrindo um payload malicioso simples
  (`<img src=x onerror=alert(1)>` ou similar), garantindo que o output
  continua sanitizado após o bump.
- Grupo C: nenhum teste novo — a suíte Jest/Playwright existente já cobre a
  cadeia de build/test; qualquer falha após o bump indica uma breaking
  change do pacote-pai que precisa ser investigada.

## Rollout / risk mitigation
1. Landar o **Grupo A** (`js-cookie`) primeiro — menor risco, valida o fluxo
   de PR/CI para esta spec.
2. Landar o **Grupo C** (dev-tooling) em seguida — mesmo cobrindo mais
   pacotes, o risco é limitado a build/test (nunca chega ao usuário final);
   fácil de reverter isoladamente se algum step de CI quebrar.
3. Landar o **Grupo B** (`dompurify`) por último — é a única mudança que
   afeta o runtime do usuário final (sanitização de conteúdo), então deve
   vir com o teste de regressão do plano acima e uma verificação manual
   antes do merge.
4. Cada grupo é um PR/commit separado e reviável, para isolar qualquer
   regressão ao grupo específico.
