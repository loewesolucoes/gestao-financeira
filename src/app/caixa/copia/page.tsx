"use client";

import { Layout } from "@/app/shared/layout";
import "./page.scss";
import { useSearchParams } from "next/navigation";
import moment from "moment";
import { useStorage } from "@/app/contexts/storage";
import { useEffect, useState } from "react";
import { Caixa, TableNames, TipoDeReceita } from "@/app/utils/db-repository";
import { ListaCaixa } from "../components/lista-caixa";
import { BalancoDoMes } from "../components/balanco-do-mes";
import { Loader } from "@/app/components/loader";
import { NumberUtil } from "@/app/utils/number";
import { Input } from "@/app/components/input";
import { Modal } from "@/app/components/modal";
import { TransacaoForm } from "../components/transacao-form";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";

function CopiaCaixaPage() {
  const params = useSearchParams()
  const month = params.get('month');
  const momentMonth = moment(month, 'YYYY-MM');

  const { isDbOk, repository } = useStorage();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [yearAndMonth, setYearAndMonth] = useState<Date>(new Date());
  const [transacoes, setTransacoes] = useState<Caixa[]>([]);
  const [editTransacao, setEditTransacao] = useState<Caixa | null>();
  const [isNewTransacaoOpen, setIsNewTransacaoOpen] = useState<boolean>(false);

  useEffect(() => {
    isDbOk && load();
  }, [isDbOk]);

  async function load() {
    setIsLoading(true);

    const result = await repository.listByMonth(TableNames.TRANSACOES, momentMonth.get('month'), momentMonth.get('year'));

    result.forEach(x => {
      // @ts-ignore
      delete x.id;
      // @ts-ignore
      delete x.createdDate;
      delete x.updatedDate;
      x.data = new Date();
    });

    console.log(result);

    setTransacoes(result);
    setIsLoading(false);
  }

  async function save() {
    console.log(yearAndMonth, transacoes);
  }

  function removerTransacao(transacao: Caixa) {
    const index = transacoes.indexOf(transacao)

    const nextTransacoes = [...transacoes]

    nextTransacoes.splice(index, 1);
    setTransacoes(nextTransacoes);
  }

  function salvarTransacao(previousTransacao: Caixa, nextTransacao: Caixa) {
    const index = transacoes.indexOf(previousTransacao)

    const nextTransacoes = [...transacoes]

    nextTransacoes[index] = nextTransacao;
    setTransacoes(nextTransacoes);
  }

  function addTransacao(transacao: Caixa) {
    const nextTransacoes = [...transacoes]

    nextTransacoes.push(transacao);
    setTransacoes(nextTransacoes);
  }

  function trocarPosicao(drop: DropResult) {
    console.log(arguments);

    const nextTransacoes = [...transacoes]

    const destIndex = drop.destination?.index as any
    const srcIndex = drop.source.index as any
    const srcTemp = nextTransacoes[srcIndex];

    nextTransacoes.splice(srcIndex, 1);
    nextTransacoes.splice(destIndex, 0, srcTemp);

    setTransacoes(nextTransacoes);
  }

  return (
    <main className="caixa container mt-3 d-flex flex-column gap-3">
      <h1>Copiar transações do mês: {momentMonth.format('MMMM YYYY')}</h1>
      {isLoading
        ? <Loader className="align-self-center my-5" />
        : (
          <>
            <div className="d-flex justify-content-center justify-content-lg-end">
              <div className="d-flex gap-3 flex-column flex-lg-row">
                <button type="button" className="btn btn-dark" onClick={e => setIsNewTransacaoOpen(true)}>Adicionar nova</button>
              </div>
            </div>
            <DragDropContext onDragEnd={trocarPosicao}>
              <Droppable droppableId="droppable">
                {(provided, snapshot) => (
                  <>
                    <ul
                      {...provided.droppableProps}
                      className={`list-group ${snapshot.isDraggingOver && 'text-bg-dark'}`}
                      ref={provided.innerRef}
                    >
                      {transacoes.map((x, i) => (
                        <Draggable key={`${x.local}:${i}`} draggableId={`${x.local}:${i}`} index={i}>
                          {(provided, snapshot) => (
                            <li ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              style={provided.draggableProps.style} className={`list-group-item ${!x.valor?.toNumber() && 'list-group-item-warning'} ${snapshot.isDragging && 'active'}`}>
                              <div className="d-flex w-100 justify-content-between gap-3">
                                <h5>{x.local}</h5>
                                <div className="d-flex justify-content-between gap-3">
                                  <small>{moment(x.data).format('DD/MM/YY')}</small>
                                  <small className={x.tipo === TipoDeReceita.FIXO ? 'text-primary' : 'text-info'}>{x.tipo === TipoDeReceita.FIXO ? 'Fixo' : 'Variável'}</small>
                                </div>
                              </div>
                              <div className="d-flex w-100 justify-content-between gap-3">
                                <p>{x.valor?.toNumber() ? NumberUtil.toCurrency(x.valor) : 'sem valor'}</p>
                                <div className="d-flex gap-3">
                                  <button className="btn btn-secondary" onClick={e => setEditTransacao(x)}>Editar</button>
                                  <button className="btn btn-danger" onClick={e => removerTransacao(x)}>Remover</button>
                                </div>
                              </div>
                              <small>{x.comentario}</small>
                            </li>
                          )}
                        </Draggable>
                      ))}
                    </ul>
                    {provided.placeholder}
                  </>
                )}
              </Droppable>
            </DragDropContext>
            <div className="d-flex justify-content-center justify-content-lg-end">
              <div className="d-flex gap-3 flex-column flex-lg-row">
                <div className="form-floating">
                  <Input type="month" className="form-control" id="data" placeholder="Mês a aplicar" value={yearAndMonth} onChange={x => setYearAndMonth(x)} />
                  <label htmlFor="data" className="form-label">Mês a aplicar</label>
                </div>
                <button type="button" className="btn btn-primary" onClick={e => save()}>Copiar transações para o mês</button>
              </div>
            </div>
          </>
        )}
      {editTransacao && (
        <Modal hideFooter={true} onClose={() => setEditTransacao(null)} title={`Detalhes da transação: ${editTransacao?.local}`}>
          <TransacaoForm transacao={editTransacao} cleanStyle={true} onClose={() => setEditTransacao(null)} onCustomSubmit={x => salvarTransacao(editTransacao, x)} onCustomDelete={x => removerTransacao(editTransacao)} />
        </Modal>
      )}
      {isNewTransacaoOpen && (
        <Modal hideFooter={true} onClose={() => setIsNewTransacaoOpen(false)} title={`Adicionar transação`}>
          <TransacaoForm cleanStyle={true} onClose={() => setIsNewTransacaoOpen(false)} onCustomSubmit={x => addTransacao(x)} onCustomDelete={x => setIsNewTransacaoOpen(false)} />
        </Modal>
      )}
    </main>
  );
}

export default function Page() {
  return (
    <Layout>
      <CopiaCaixaPage />
    </Layout>
  );
}

