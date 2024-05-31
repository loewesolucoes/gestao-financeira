"use client";

import "./page.scss";

import { Layout } from "../shared/layout";
import { useEffect } from "react";

function Emprestimos() {
  useEffect(() => {
    document.title = `Empréstimo | ${process.env.NEXT_PUBLIC_TITLE}`
  }, []);
  
  return (
    <main className="emprestimos container mt-3">
      <h1>Empréstimo</h1>
    </main>
  );
}

export default function Page() {
  return (
    <Layout>
      <Emprestimos />
    </Layout>
  );
}

