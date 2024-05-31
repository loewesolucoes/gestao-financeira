import moment from "moment";
import { useRouter, useSearchParams } from "next/navigation";
import { useStorage } from "@/app/contexts/storage";
import { useEffect, useState } from "react";
import { Transacoes, TableNames, TipoDeReceita } from "@/app/utils/db-repository";
import { Loader } from "@/app/components/loader";
import { NumberUtil } from "@/app/utils/number";
import { Input } from "@/app/components/input";
import { Modal } from "@/app/components/modal";
import { TransacaoForm } from "./transacao-form";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
import BigNumber from "bignumber.js";

interface CustomProps {
  tableName?: TableNames
  isCopy?: boolean
}

const todayDate = new Date();

export function EditarEmMassa({ isCopy, tableName: tn }: CustomProps) {
  const tableName = tn || TableNames.TRANSACOES
  const params = useSearchParams();
  const month = params.get('month');
  const momentMonth = moment(month, 'YYYY-MM');
  const router = useRouter();

  const { isDbOk, repository } = useStorage();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [yearAndMonth, setYearAndMonth] = useState<Date>(todayDate);
  const [transacoes, setTransacoes] = useState<Transacoes[]>([]);
  const [transacoesRemovidas, setTransacoesRemovidas] = useState<Transacoes[]>([]);
  const [editTransacao, setEditTransacao] = useState<Transacoes | null>();
  const [isNewTransacaoOpen, setIsNewTransacaoOpen] = useState<boolean>(false);

  const isPatrimonio = tableName === TableNames.PATRIMONIO;

  useEffect(() => {
    isDbOk && load();
  }, [isDbOk]);

  async function load() {
    setIsLoading(true);

    const result = await repository.listByMonth(tableName, momentMonth.format('MM'), momentMonth.format('YYYY'));

    if (isCopy) {
      result.forEach(x => {
        // @ts-ignore
        delete x.id;
        // @ts-ignore
        delete x.createdDate;
        delete x.updatedDate;
        x.data = todayDate;
      });
    }

    setTransacoes(result);
    setIsLoading(false);
  }

  async function save() {
    if (!confirm('Você tem certeza?'))
      return;

    setIsLoading(true);

    const transacoesOk = [...transacoes];

    if (isCopy) {
      transacoesOk.forEach(x => {
        x.data = x.data === todayDate ? yearAndMonth : x.data;
      });
    }

    transacoesOk.forEach((x, i) => {
      x.ordem = i;
    });

    await Promise.all(transacoesRemovidas.filter(x => x.id).map(x => repository.delete(tableName, x.id)))
    await repository.saveAll(tableName, transacoesOk);

    setIsLoading(false);
    router.push(isPatrimonio ? '/patrimonio' : '/caixa');
  }

  function removerTransacao(transacao: Transacoes) {
    const index = transacoes.indexOf(transacao);

    const nextTransacoes = [...transacoes];

    nextTransacoes.splice(index, 1);
    setTransacoes(nextTransacoes);
    setTransacoesRemovidas([...transacoesRemovidas, transacao]);
  }

  function salvarTransacao(previousTransacao: Transacoes, nextTransacao: Transacoes) {
    const index = transacoes.indexOf(previousTransacao);

    const nextTransacoes = [...transacoes];

    nextTransacoes[index] = { ...nextTransacao };
    setTransacoes(nextTransacoes);
  }

  function addTransacao(transacao: Transacoes) {
    const nextTransacoes = [...transacoes];

    nextTransacoes.push(transacao);
    setTransacoes(nextTransacoes);
  }

  function trocarPosicao(drop: DropResult) {
    console.log(arguments);

    const nextTransacoes = [...transacoes];

    const destIndex = drop.destination?.index as any;
    const srcIndex = drop.source.index as any;
    const srcTemp = nextTransacoes[srcIndex];

    nextTransacoes.splice(srcIndex, 1);
    nextTransacoes.splice(destIndex, 0, srcTemp);

    setTransacoes(nextTransacoes);
  }

  const total = transacoes.filter(x => x?.valor).reduce((p, n) => { return n.valor.plus(p); }, BigNumber(0));

  return (
    <>
      {isLoading
        ? <Loader className="align-self-center my-5" />
        : (
          <>
            <div className="d-flex justify-content-between align-items-center align-items-lg-end flex-column flex-lg-row gap-3">
              <BalancoMes total={total} />
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
                                  {x.tipo !== undefined && (
                                    <small className={x.tipo === TipoDeReceita.FIXO ? 'text-primary' : 'text-info'}>{x.tipo === TipoDeReceita.FIXO ? 'Fixo' : 'Variável'}</small>
                                  )}
                                </div>
                              </div>
                              <div className="d-flex w-100 justify-content-between gap-3">
                                <p>{x.valor?.toNumber() ? NumberUtil.toCurrency(x.valor) : 'sem valor'}</p>
                                <div className="d-flex gap-3 flex-column flex-lg-row">
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
                <BalancoMes total={total} />
                {isCopy && (
                  <div className="form-floating">
                    <Input type="month" className="form-control" id="data" placeholder="Mês a aplicar" value={yearAndMonth} onChange={x => setYearAndMonth(x)} />
                    <label htmlFor="data" className="form-label">Mês a aplicar</label>
                  </div>
                )}
                <button type="button" className="btn btn-primary" onClick={e => save()}>{isCopy ? 'Copiar transações para o mês' : 'Salvar transações do mês'}</button>
              </div>
            </div>
          </>
        )}
      {editTransacao && (
        <Modal hideFooter={true} onClose={() => setEditTransacao(null)} title={`Detalhes da transação: ${editTransacao?.local}`}>
          <TransacaoForm tableName={tableName} transacao={editTransacao} cleanStyle={true} onClose={() => setEditTransacao(null)} onCustomSubmit={x => salvarTransacao(editTransacao, x)} onCustomDelete={x => removerTransacao(editTransacao)} />
        </Modal>
      )}
      {isNewTransacaoOpen && (
        <Modal hideFooter={true} onClose={() => setIsNewTransacaoOpen(false)} title={`Adicionar transação`}>
          <TransacaoForm tableName={tableName} cleanStyle={true} onClose={() => setIsNewTransacaoOpen(false)} onCustomSubmit={x => addTransacao(x)} onCustomDelete={x => setIsNewTransacaoOpen(false)} />
        </Modal>
      )}
    </>
  );
}

function BalancoMes({ total }: any) {
  return <div className="d-flex gap-3">
    <h5>Balanço do mês</h5>
    <div className="d-flex flex-column">
      <p className="m-0">{NumberUtil.toCurrency(total)}</p>
      <small>{NumberUtil.extenso(total)}</small>
    </div>
  </div>;
}

