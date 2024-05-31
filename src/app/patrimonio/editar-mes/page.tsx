"use client";

import { Layout } from "@/app/shared/layout";
import "./page.scss";
import { EditarEmMassa } from "../../caixa/components/editar-em-massa";
import { useSearchParams } from "next/navigation";
import moment from "moment";
import { TableNames } from "@/app/utils/db-repository";

function EditarMesPage() {
  const params = useSearchParams();
  const month = params.get('month');
  const momentMonth = moment(month, 'YYYY-MM');

  return (
    <main className="patrimonio container mt-3 d-flex flex-column gap-3">
      <h1>Editar mês: {momentMonth.format('MMMM YYYY')}</h1>
      <EditarEmMassa isCopy={false} tableName={TableNames.PATRIMONIO} />
    </main>
  )
}

export default function Page() {
  return (
    <Layout>
      <EditarMesPage />
    </Layout>
  );
}

