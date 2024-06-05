"use client";

import { Layout } from "@/app/shared/layout";
import "./page.scss";
import { EditarEmMassa } from "../components/editar-em-massa";
import moment from "moment";
import { useLocation } from "@/app/contexts/location";

function CopiaCaixaPage() {
  const { params } = useLocation();
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

