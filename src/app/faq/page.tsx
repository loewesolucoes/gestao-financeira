"use client";

import "./page.scss";

import { Layout } from "../shared/layout";
import ArrowIcon from './arrow.svg'
import { useEffect, useState } from "react";
import Link from "next/link";

// TODO: trocar pra um arquivo markdown
const qea = [
  {
    question: "Como faço para registrar minhas receitas e despesas do mês?",
    answer: <p className="mw-md mt-4 mb-0">Na seção Caixa, adicione uma transação informando o valor, a data, a categoria e se é uma entrada ou saída. O sistema organiza tudo por mês, para você acompanhar facilmente o saldo e os gastos de cada período.</p>,
  },
  {
    question: "Como funcionam as Metas de economia?",
    answer: <p className="mw-md mt-4 mb-0">Em Metas, você define um objetivo (por exemplo, juntar um valor até uma data) e registra os aportes ao longo do tempo. O sistema mostra o progresso em relação ao valor planejado, ajudando você a acompanhar se está no caminho certo.</p>,
  },
  {
    question: "O que é o módulo de Patrimônio e para que serve?",
    answer: <p className="mw-md mt-4 mb-0">O Patrimônio permite registrar seus bens e investimentos (contas, aplicações, imóveis, veículos, etc.) para acompanhar a evolução do seu patrimônio líquido ao longo do tempo.</p>,
  },
  {
    question: "Consigo controlar empréstimos que fiz ou recebi?",
    answer: <p className="mw-md mt-4 mb-0">Sim! Em Empréstimos você pode cadastrar valores emprestados a terceiros ou tomados de terceiros, acompanhando parcelas, datas e o saldo devedor de cada um.</p>,
  },
  {
    question: "Que tipo de relatórios o sistema oferece?",
    answer: <p className="mw-md mt-4 mb-0">Em Relatórios você encontra gráficos e resumos sobre receitas, despesas e evolução financeira, ajudando a visualizar padrões de gastos e economia ao longo dos meses.</p>,
  },
  {
    question: "Para que serve a seção de Notas?",
    answer: <p className="mw-md mt-4 mb-0">As Notas permitem registrar observações, lembretes ou informações relacionadas às suas finanças, como detalhes de uma negociação ou um lembrete de pagamento futuro.</p>,
  },
  {
    question: "Onde meus dados financeiros ficam armazenados? É seguro?",
    answer: <p className="mw-md mt-4 mb-0">Todos os seus dados ficam salvos apenas no seu próprio dispositivo, dentro do navegador. Não existe servidor recebendo ou armazenando suas informações financeiras — nada é enviado para fora do seu aparelho, a menos que você opte por fazer backup no Google Drive.</p>,
  },
  {
    question: "Como faço backup dos meus dados?",
    answer: <p className="mw-md mt-4 mb-0">Em Configurações, você pode ativar o backup no Google Drive, que salva uma cópia criptografada do seu banco de dados na sua própria conta Google. O uso do backup é opcional e você pode restaurar seus dados a partir dele quando quiser.</p>,
  },
  {
    question: "O sistema funciona sem internet?",
    answer: <p className="mw-md mt-4 mb-0">Sim! Por ser um aplicativo (PWA), ele pode ser instalado no seu celular ou computador e continua funcionando offline, já que todos os dados ficam armazenados localmente.</p>,
  },
  {
    question: "É possível usar o sistema no modo escuro?",
    answer: <p className="mw-md mt-4 mb-0">Sim! Em Configurações você pode alternar entre o tema claro e o tema escuro, e a preferência escolhida é lembrada nos próximos acessos.</p>,
  },
  {
    question: "Vocês possuem Termos de uso e Política de Privacidade?",
    answer: <span className="d-flex flex-column"><span>Sim! Eles podem ser encontrado aqui:</span> <ul> <li><Link href="/termos-de-uso">Termos de uso</Link></li>&nbsp; <li><Link href="/politica-de-privacidade">Política de Privacidade</Link> </li> </ul></span>,
  },
]

function FAQ() {
  const [opened, setOpened] = useState<any>({});

  useEffect(() => {
    document.title = `Perguntas frequentes | ${process.env.NEXT_PUBLIC_TITLE}`
  }, []);

  return (
    <main className="faq container mt-3">
      <section className="py-12 py-sm-24 bg-info-light ">
        <div className="container">
          <div className="mb-5 text-center">
            <span className="fs-5 fw-semibold text-primary text-uppercase">POSSUI ALGUMA DÚVIDA?</span>
            <h1 className="mt-3 mb-0">Perguntas frequentes</h1>
          </div>
          <ul className="questions mb-3">
            {qea.map(x => (
              <li key={x.question} className={`question ${opened[x.question] && 'show'}`}>
                <button className="btn p-4 mb-2 w-100 bg-white fw-medium text-start lh-base rounded-4 border border-primary" onClick={e => setOpened({ ...opened, [x.question]: !opened[x.question] })}>
                  <div className="d-flex justify-content-between">
                    <div>
                      <h6 className="fs-7 mb-0 text-success">{x.question}</h6>
                    </div>
                    <div className="ps-4">
                      <ArrowIcon className="arrow" />
                    </div>
                  </div>
                  <span className="answer">{x.answer}</span>
                </button>
              </li>
            ))}
          </ul>
          <p className="d-flex flex-wrap align-items-center justify-content-center">
            <span className="me-1">Ainda com dúvidas?</span>
            <a className="btn px-0 btn-link fw-bold" href="https://loewesolucoes.github.io/">Entre em contato</a>
          </p>
        </div>
      </section>
    </main>
  );
}

export default function Page() {
  return (
    <Layout>
      <FAQ />
    </Layout>
  );
}

