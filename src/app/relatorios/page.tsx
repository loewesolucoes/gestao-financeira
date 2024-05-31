"use client";

import "./page.scss";

import { Layout } from "../shared/layout";
import { useEffect } from "react";

function Relatorios() {
  useEffect(() => {
    document.title = `Relatórios | ${process.env.NEXT_PUBLIC_TITLE}`
  }, []);
  
  return (
    <main className="relatorios container mt-3">
      <h1>Relatórios</h1>
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

