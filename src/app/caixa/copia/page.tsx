"use client";

import { Layout } from "@/app/shared/layout";
import "./page.scss";
import { EditarEmMassa } from "../components/editar-em-massa";
import { useSearchParams } from "next/navigation";
import moment from "moment";

function CopiaCaixaPage() {
  const params = useSearchParams();
  const month = params.get('month');
  const momentMonth = moment(month, 'YYYY-MM');

  return (
    <main className="caixa container mt-3 d-flex flex-column gap-3">
      <h1>Copiar transações do mês: {momentMonth.format('MMMM YYYY')}</h1>
      <EditarEmMassa isCopy={true} />
    </main>
  )
}

export default function Page() {
  return (
    <Layout>
      <CopiaCaixaPage />
    </Layout>
  );
}

