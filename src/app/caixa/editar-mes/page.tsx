"use client";

import { Layout } from "@/app/shared/layout";
import "./page.scss";
import { EditarEmMassa } from "../components/editar-em-massa";
import moment from "moment";
import { useLocation } from "@/app/contexts/location";
import { use, useEffect, useState } from "react";

function EditarMesPage() {
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
      <h1>Editar mês: {dateToShow}</h1>
      <EditarEmMassa isCopy={false} />
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

