import "./page.scss";

import { useEffect, useState } from "react";

import { useStorage } from "../contexts/storage";
import { PeriodoTransacoes, TotaisHome, Transacoes } from "../repositories/transacoes";
import { Loader } from "../components/loader";
import { useEnv } from "../contexts/env";
import Link from "next/link";
import { DateUtil } from "../utils/date";
import { useAuth } from "../contexts/auth";
import { HomeCharts } from "./components/charts-list";
import { PeriodoForm } from "./components/periodo";
import { HomeCashAndGoals } from "./components/cash-and-goals";
import moment from "moment";
import { ListaCaixa } from "../caixa/components/lista-caixa";
import { TableNames } from "../repositories/default";

export function Home() {
  const { isDbOk, repository } = useStorage();
  const { userInfo } = useAuth();
  const { isMobile } = useEnv();

  const [yearAndMonth, setYearAndMonth] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [totais, setTotais] = useState<TotaisHome>({} as any);
  const [periodo, setPeriodo] = useState<PeriodoTransacoes>(PeriodoTransacoes.TRES_ULTIMOS_MESES);

  useEffect(() => {
    document.title = `Dashboard | ${process.env.NEXT_PUBLIC_TITLE}`
  }, []);

  useEffect(() => {
    setPeriodo(isMobile ? PeriodoTransacoes.TRES_ULTIMOS_MESES : PeriodoTransacoes.ULTIMO_ANO);
  }, [isMobile]);

  useEffect(() => {
    isDbOk && load();
  }, [isDbOk, isMobile, yearAndMonth]);

  async function load() {
    setIsLoading(true);

    const result = await repository.transacoes.totais(yearAndMonth);

    setTotais(result);
    setIsLoading(false);
  }

  const { despesas, receitas, valorEmCaixa, transacoesAcumuladaPorMes, metas, transacoesDoMes, transacoesComNotasECategorias } = totais
  const sobra = receitas?.minus(despesas?.abs())

  return (
    <main className="main container">
      <h1 className="mt-xl-3">👋 {DateUtil.generateGreetings()}{userInfo ? ', ' + userInfo?.user?.displayName : ''}</h1>
      <NoData isLoading={isLoading} valorEmCaixa={valorEmCaixa} />
      <section className="home d-flex flex-column my-3 gap-3">
        {isLoading
          ? (<div className="home-loader py-5"><Loader /></div>)
          : (
            <>
              <HomeCashAndGoals valorEmCaixa={valorEmCaixa} yearAndMonth={yearAndMonth} setYearAndMonth={setYearAndMonth} metas={metas} sobra={sobra} receitas={receitas} despesas={despesas} />
              <PeriodoForm periodo={periodo} setPeriodo={setPeriodo} />
              <HomeCharts transacoesAcumuladaPorMes={transacoesAcumuladaPorMes} transacoesComNotasECategorias={transacoesComNotasECategorias} periodo={periodo} />
              <HomeTable transacoesDoMes={transacoesDoMes} yearAndMonth={yearAndMonth} />
            </>
          )}
      </section>
    </main>
  );
}

function HomeTable({ transacoesDoMes, yearAndMonth }: { transacoesDoMes: Transacoes[], yearAndMonth: Date }) {
  return <section>
    <h4>Transações do mês {moment(yearAndMonth).format('MMMM YYYY')} <Link href={"/caixa"} className="btn btn-secondary btn-sm float-end">Ver caixa</Link></h4>
    <ListaCaixa transacoesDoPeriodo={transacoesDoMes} tableName={TableNames.TRANSACOES} />
  </section>;
}

function NoData({ isLoading, valorEmCaixa }) {
  return !isLoading && valorEmCaixa == null ? (
    <p className="alert alert-warning my-3" role="alert">
      Nenhum dado cadastrado. Cadastre novas transações no <Link href={"/caixa"}>Caixa</Link> ou metas em <Link href={"/metas"}>Metas</Link> para visualizar seus dados financeiros aqui.
    </p>) : null;
}