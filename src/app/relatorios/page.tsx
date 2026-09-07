"use client";

import "./page.scss";

import { Layout } from "../shared/layout";
import { useEffect } from "react";
import { ChatIa } from "./components/chat-ia";

function Relatorios() {
  useEffect(() => {
    document.title = `Relatórios | ${process.env.NEXT_PUBLIC_TITLE}`
  }, []);

  return (
    <main className="relatorios container mt-3">
      <h1>Relatórios</h1>
      <p>Converse com o assistente de IA para tirar dúvidas sobre suas finanças, com base nos seus dados reais.</p>
      <section className="card">
        <h5 className="card-header">Assistente de IA</h5>
        <div className="card-body">
          <ChatIa />
        </div>
      </section>
    </main>
  );
}

export default function Page() {
  return (
    <Layout>
      <Relatorios />
    </Layout>
  );
}

