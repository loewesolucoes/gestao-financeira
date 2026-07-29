# Plan: Perguntas reais do FAQ

Companion technical design for `spec.md`. Only one file changes in the
implementation: `src/app/faq/page.tsx`. No other component, style, or schema
changes are needed.

## Target file layout

```
src/app/faq/page.tsx   # `qea` array content replaced (edited, not created)
```

- No new files, no changes to `page.scss`, `arrow.svg`, or the `FAQ`/`Page`
  component logic — the collapse/expand behavior driven by `opened` state and the
  `<ArrowIcon>` toggle stay untouched.
- The `// TODO: trocar pra um arquivo markdown` comment above `qea` stays as-is;
  moving to markdown is explicitly out of scope (see spec Non-goals).

## Final drafted content for `qea`

Replace the current array with the following 11 entries (10 new + the existing
Termos/Política entry, kept unchanged as the last item to match today's ordering
convention of ending on a "meta" question). Each new answer keeps the same JSX
shape as today: `<p className="mw-md mt-4 mb-0">...</p>`.

1. **Q:** Como faço para registrar minhas receitas e despesas do mês?
   **A:** Na seção Caixa, adicione uma transação informando o valor, a data, a
   categoria e se é uma entrada ou saída. O sistema organiza tudo por mês, para
   você acompanhar facilmente o saldo e os gastos de cada período.

2. **Q:** Como funcionam as Metas de economia?
   **A:** Em Metas, você define um objetivo (por exemplo, juntar um valor até uma
   data) e registra os aportes ao longo do tempo. O sistema mostra o progresso em
   relação ao valor planejado, ajudando você a acompanhar se está no caminho certo.

3. **Q:** O que é o módulo de Patrimônio e para que serve?
   **A:** O Patrimônio permite registrar seus bens e investimentos (contas,
   aplicações, imóveis, veículos, etc.) para acompanhar a evolução do seu
   patrimônio líquido ao longo do tempo.

4. **Q:** Consigo controlar empréstimos que fiz ou recebi?
   **A:** Sim! Em Empréstimos você pode cadastrar valores emprestados a terceiros
   ou tomados de terceiros, acompanhando parcelas, datas e o saldo devedor de cada
   um.

5. **Q:** Que tipo de relatórios o sistema oferece?
   **A:** Em Relatórios você encontra gráficos e resumos sobre receitas, despesas
   e evolução financeira, ajudando a visualizar padrões de gastos e economia ao
   longo dos meses.

6. **Q:** Para que serve a seção de Notas?
   **A:** As Notas permitem registrar observações, lembretes ou informações
   relacionadas às suas finanças, como detalhes de uma negociação ou um lembrete
   de pagamento futuro.

7. **Q:** Onde meus dados financeiros ficam armazenados? É seguro?
   **A:** Todos os seus dados ficam salvos apenas no seu próprio dispositivo,
   dentro do navegador. Não existe servidor recebendo ou armazenando suas
   informações financeiras — nada é enviado para fora do seu aparelho, a menos que
   você opte por fazer backup no Google Drive.

8. **Q:** Como faço backup dos meus dados?
   **A:** Em Configurações, você pode ativar o backup no Google Drive, que salva
   uma cópia criptografada do seu banco de dados na sua própria conta Google. O uso
   do backup é opcional e você pode restaurar seus dados a partir dele quando
   quiser.

9. **Q:** O sistema funciona sem internet?
   **A:** Sim! Por ser um aplicativo (PWA), ele pode ser instalado no seu celular
   ou computador e continua funcionando offline, já que todos os dados ficam
   armazenados localmente.

10. **Q:** É possível usar o sistema no modo escuro?
    **A:** Sim! Em Configurações você pode alternar entre o tema claro e o tema
    escuro, e a preferência escolhida é lembrada nos próximos acessos.

11. **Q:** Vocês possuem Termos de uso e Política de Privacidade? *(mantido sem
    alterações)*
    **A:** *(mantém o JSX atual, com os links para `/termos-de-uso` e
    `/politica-de-privacidade`)*

## Implementation notes
- Keep object keys as `question`/`answer` and continue using `x.question` as the
  React `key` in the `.map()` — all 11 questions above are unique strings, so no
  key-collision risk.
- Answers 1–10 use plain `<p className="mw-md mt-4 mb-0">...</p>` just like the
  current simple answers (e.g. today's "Como faço para criar um orçamento
  detalhado?").
- Answer 11 keeps the exact current JSX (the `<span className="d-flex
  flex-column">...` block with the `<ul>`/`<Link>` items) unchanged, only
  relocated to the end of the array.
- No changes to imports, `useEffect`, `useState`, or the surrounding `<main>`/
  `<section>`/`<ul className="questions">` markup.
