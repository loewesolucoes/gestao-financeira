"use client";

import "./page.scss";

import { Layout } from "../shared/layout";

function Caixa() {
  return (
    <main className="caixa container mt-3">
      <h1>Caixa</h1>
    </main>
  );
}

export default function Page() {
  return (
    <Layout>
      <Caixa />
    </Layout>
  );
}

