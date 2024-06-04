"use client";

import "./page.scss";

import { Layout } from "../shared/layout";

function Offline() {
  return (
    <main className="offline container mt-3">
      <h1>Você esta offline</h1>
    </main>
  );
}

export default function Page() {
  return (
    <Layout>
      <Offline />
    </Layout>
  );
}

