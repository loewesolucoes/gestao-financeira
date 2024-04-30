"use client";

import "./page.scss";

import { Layout } from "../shared/layout";

function Relatorios() {
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

