"use client";

import "./page.scss";
// import { add, multiply, divide, format } from "mathjs";

import { useEffect, useState } from "react";

import { Layout } from "./shared/layout";
import { useStorage } from "./contexts/storage";
import { TipoDeMeta } from "./repositories/metas";
import { TotaisHome } from "./repositories/transacoes";
import { Loader } from "./components/loader";
import { NumberUtil } from "./utils/number";
import { Input } from "./components/input";
import { useEnv } from "./contexts/env";
import moment from "moment";
import { GraficoCaixaAcumuladoMesAMes, GraficoBalancoMesAMes, GraficoCaixaVariacaoAcumuladoMesAMes, GraficoCaixaVariacaoPercentualAcumuladoMesAMes } from "./components/home/graficos-home";
import Link from "next/link";
import { DateUtil } from "./utils/date";
import { useAuth } from "./contexts/auth";

const MOBILE_TRANSACOES_POR_MES = 4;

function Home() {
  const { isDbOk, repository } = useStorage();
  const { userInfo } = useAuth();
  const { isMobile } = useEnv();

  const [yearAndMonth, setYearAndMonth] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [totais, setTotais] = useState<TotaisHome>({} as any);

  useEffect(() => {
    document.title = `Dashboard | ${process.env.NEXT_PUBLIC_TITLE}`
  }, []);

  useEffect(() => {
    isDbOk && load();
  }, [isDbOk, isMobile, yearAndMonth]);

  async function load() {
    setIsLoading(true);
    const result = await repository.transacoes.totais(yearAndMonth);


    console.info('load', result);

    const hasALotOFTransacoes = Array.isArray(result.transacoesAcumuladaPorMes) && result.transacoesAcumuladaPorMes.length > MOBILE_TRANSACOES_POR_MES * 1.5;

    if (isMobile && hasALotOFTransacoes)
      result.transacoesAcumuladaPorMes.splice(0, result.transacoesAcumuladaPorMes.length - MOBILE_TRANSACOES_POR_MES);

    setTotais(result);
    setIsLoading(false);
  }

  const { despesas, receitas, valorEmCaixa, transacoesAcumuladaPorMes, metas } = totais
  const sobra = receitas?.minus(despesas?.abs())

  return (
    <main className="main container">
      <h1 className="mt-lg-3">👋 {DateUtil.generateGreetings()}{userInfo ? ', ' + userInfo?.user?.displayName : ''}</h1>
      <NoData isLoading={isLoading} valorEmCaixa={valorEmCaixa} />
      <section className="home my-3">
        {isLoading
          ? (<div className="home-loader py-5"><Loader /></div>)
          : (
            <>
              <section className="card border-primary card-caixa">
                <h4 className="card-header">Caixa Geral</h4>
                <div className="card-body">
                  <div className="d-flex gap-3">
                    <h5>Valor em caixa</h5>
                    <div className="d-flex flex-column">
                      <p className="m-0">{NumberUtil.toCurrency(valorEmCaixa)}</p>
                      <small>{NumberUtil.extenso(valorEmCaixa)}</small>
                    </div>
                  </div>
                  <div className="d-flex gap-3 mt-3 flex-column flex-xlg-row">
                    <h5>Escolha um mês</h5>
                    <div className="form-floating">
                      <Input type="month" className="form-control" id="data" placeholder="Mês a aplicar" value={yearAndMonth} onChange={x => setYearAndMonth(x)} />
                      <label htmlFor="data" className="form-label">Mês a aplicar</label>
                    </div>
                  </div>
                </div>
              </section>
              <section className="card border-dark">
                <h4 className="card-header">Caixa do mês: {moment(yearAndMonth).format('MMMM YYYY')}</h4>
                <div className="card-body">
                  {sobra == null
                    ? (<div className="alert alert-info" role="alert">Mês sem dados</div>)
                    : (
                      <>
                        <div className="d-flex gap-3">
                          <h5>Receitas:</h5>
                          <div className="d-flex flex-column">
                            <p className="m-0">{NumberUtil.toCurrency(receitas)}</p>
                            <small>{NumberUtil.extenso(receitas)}</small>
                          </div>
                        </div>
                        <div className="d-flex gap-3">
                          <h5>Depesas:</h5>
                          <div className="d-flex flex-column">
                            <p className="m-0">{NumberUtil.toCurrency(despesas)}</p>
                            <small>{NumberUtil.extenso(despesas)}</small>
                          </div>
                        </div>
                        <div className="d-flex gap-3">
                          <h5>Sobra:</h5>
                          <div className="d-flex flex-column">
                            <p className="m-0">{NumberUtil.toCurrency(sobra)}</p>
                            <small>{NumberUtil.extenso(sobra)}</small>
                          </div>
                        </div>
                      </>
                    )}
                </div>
              </section>
              <section className="card border-primary card-metas">
                <h4 className="card-header">Metas</h4>
                <div className="card-body">
                  {(metas == null || metas.length === 0) && (<div className="alert alert-info" role="alert">Nenhuma meta cadastrada no ano.</div>)}
                  <ul className="list-group">
                    {metas?.map((x, i) => (
                      <li key={`${x.data}:${x.descricao}:${i}`} className={`list-group-item ${x.descricao == null ? 'list-group-item-info' : ''} ${x.tipo === TipoDeMeta.PESSOAL ? 'list-group-item-success' : ''}  ${x.tipo === TipoDeMeta.FINANCEIRA ? 'list-group-item-warning' : ''}`}>
                        <div className="d-flex w-100 justify-content-between gap-3">
                          <div className="d-flex flex-column gap-3">
                            <h6>{x.descricao}</h6>
                          </div>
                          <div className="d-flex flex-column gap-3">
                            <small>{moment(x.data).format('MMMM YYYY')}</small>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
              <section className="card border-info card-chart">
                <h4 className="card-header">Caixa acumulado mês a mês</h4>
                <div className="card-body">
                  <GraficoCaixaAcumuladoMesAMes transacoesAcumuladasPorMes={transacoesAcumuladaPorMes} />
                </div>
              </section>
              <section className="card border-info card-chart">
                <h4 className="card-header">Balanço mês a mês</h4>
                <div className="card-body">
                  <GraficoBalancoMesAMes transacoesAcumuladasPorMes={transacoesAcumuladaPorMes} />
                </div>
              </section>
              <section className="card border-info card-chart">
                <h4 className="card-header">Variação (R$) do caixa mês a mês</h4>
                <div className="card-body">
                  <GraficoCaixaVariacaoAcumuladoMesAMes transacoesAcumuladasPorMes={transacoesAcumuladaPorMes} />
                </div>
              </section>
              <section className="card border-info card-chart">
                <h4 className="card-header">Variação percentual (%) do caixa mês a mês</h4>
                <div className="card-body">
                  <GraficoCaixaVariacaoPercentualAcumuladoMesAMes transacoesAcumuladasPorMes={transacoesAcumuladaPorMes} />
                </div>
              </section>
            </>
          )}
      </section>
    </main>
  );
}



function NoData({ isLoading, valorEmCaixa }) {
  return !isLoading && valorEmCaixa == null ? (
    <p className="alert alert-warning my-3" role="alert">
      Nenhum dado cadastrado. Cadastre novas transações no <Link href={"/caixa"}>Caixa</Link> ou metas em <Link href={"/metas"}>Metas</Link> para visualizar seus dados financeiros aqui.
    </p>) : null;
}

export default function Page() {
  return (
    <Layout>
      <Home />
    </Layout>
  );
}
