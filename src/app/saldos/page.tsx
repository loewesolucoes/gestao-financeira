"use client";

import "./page.scss";

import { Layout } from "../shared/layout";

function Saldos() {
  return (
    <main className="saldos container mt-3">
      <h1>Saldos</h1>
    </main>
  );
}

export default function Page() {
  return (
    <Layout>
      <Saldos />
    </Layout>
  );
}

