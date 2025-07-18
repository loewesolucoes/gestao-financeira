"use client";

import "./page.scss";

import { Layout } from "../shared/layout";
import ArrowIcon from './arrow.svg'
import { useEffect, useState } from "react";
import Link from "next/link";

// TODO: trocar pra um arquivo markdown
const qea = [
  {
    question: "Como faço para criar um orçamento detalhado?",
    answer: <p className="mw-md mt-4 mb-0">Para criar um orçamento detalhado, acesse a seção de orçamentos no sistema. Insira os itens necessários, como materiais, mão de obra e outros recursos. O sistema calculará automaticamente os custos com base nas quantidades e preços definidos.</p>,
  },
  {
    question: "Posso controlar os gastos por centro de custo?",
    answer: <p className="mw-md mt-4 mb-0">Sim! O sistema permite que você associe cada despesa a um centro de custo específico. Dessa forma, você pode acompanhar os gastos de acordo com as diferentes áreas do projeto.</p>,
  },
  {
    question: "Como faço para solicitar cotações de fornecedores?",
    answer: <p className="mw-md mt-4 mb-0">Na seção de compras, você pode criar solicitações de cotação para os materiais necessários. O sistema enviará essas solicitações aos fornecedores cadastrados, facilitando o processo de comparação e escolha.</p>,
  },
  {
    question: "Como acompanho o progresso da obra?",
    answer: <p className="mw-md mt-4 mb-0">O sistema possui um módulo de acompanhamento de obra. Nele, você pode inserir informações sobre o avanço físico, marcos importantes e atualizações do cronograma. Isso ajuda a manter todos os envolvidos informados.</p>,
  },
  {
    question: "Existe um portal do cliente para compartilhar informações?",
    answer: <p className="mw-md mt-4 mb-0">Sim! O portal do cliente permite que os clientes acessem informações relevantes sobre a obra, como fotos, relatórios de progresso e documentos. É uma maneira eficiente de manter a transparência e a comunicação.</p>,
  },
  {
    question: "Como registro informações sobre os funcionários?",
    answer: <p className="mw-md mt-4 mb-0">No módulo de gestão de funcionários, você pode adicionar detalhes sobre cada membro da equipe, incluindo dados pessoais, documentos e alocação em projetos específicos.</p>,
  },
  {
    question: "O sistema se integra com outras ferramentas?",
    answer: <p className="mw-md mt-4 mb-0">Sim! Ele pode ser integrado com outros módulos, como recursos humanos, suprimentos e financeiro. Isso garante uma visão completa e centralizada de todas as operações.</p>,
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

