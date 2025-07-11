"use client";

import { Layout } from "@/app/shared/layout";
import "./page.scss";
import { EditarEmMassa } from "../components/editar-em-massa";
import moment from "moment";
import { useLocation } from "@/app/contexts/location";
import { useEffect, useState } from "react";

function CopiaCaixaPage() {
  const { params } = useLocation();
  const month = params.get('month');
  const momentMonth = moment(month, 'YYYY-MM');
  const [dateToShow, setDateToShow] = useState('Carregando...');

  useEffect(() => {
    setDateToShow(
      momentMonth.isValid() ? momentMonth.format('MMMM YYYY') : 'Carregando...'
    );
  }, [month]);

  return (
    <main className="caixa container mt-3 d-flex flex-column gap-3">
      <h1>Copiar transações do mês: {dateToShow}</h1>
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

