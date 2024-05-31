"use client";

import "./page.scss";

import { Layout } from "../shared/layout";

function Notas() {
  return (
    <main className="notas container mt-3">
      <h1>Notas</h1>
    </main>
  );
}

export default function Page() {
  return (
    <Layout>
      <Notas />
    </Layout>
  );
}

