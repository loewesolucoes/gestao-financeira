"use client";

import "./page.scss";

import { Layout } from "../shared/layout";
import { useEffect } from "react";

function Notas() {
  useEffect(() => {
    document.title = `Notas | ${process.env.NEXT_PUBLIC_TITLE}`
  }, []);
  
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

