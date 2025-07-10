import moment from "moment";
import { useRouter } from "next/navigation";
import { useStorage } from "@/app/contexts/storage";
import { useEffect, useState } from "react";
import { Loader } from "@/app/components/loader";
import { NumberUtil } from "@/app/utils/number";
import { Input } from "@/app/components/input";
import { Modal } from "@/app/components/modal";
import { TransacaoForm } from "./transacao-form";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
import BigNumber from "bignumber.js";
import { useLocation } from "@/app/contexts/location";
import { TableNames } from "@/app/repositories/default";
import { TipoDeReceita, Transacoes } from "@/app/repositories/transacoes";

interface CustomProps {
  tableName?: TableNames
  isCopy?: boolean
}

const todayDate = new Date();

export function EditarEmMassa({ isCopy, tableName: tn }: CustomProps) {
  const tableName = tn || TableNames.TRANSACOES
  const { params } = useLocation();
  const month = params.get('month');
  const momentMonth = moment(month, 'YYYY-MM');
  const router = useRouter();

  const { isDbOk, repository } = useStorage();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [yearAndMonth, setYearAndMonth] = useState<Date>(todayDate);
  const [transacoes, setTransacoes] = useState<Transacoes[]>([]);
  const [transacoesRemovidas, setTransacoesRemovidas] = useState<Transacoes[]>([]);
  const [isNewTransacaoOpen, setIsNewTransacaoOpen] = useState<boolean>(false);
  const [editTransacao, setEditTransacao] = useState<Transacoes | null>();

  const isPatrimonio = tableName === TableNames.PATRIMONIO;

  useEffect(() => {
    isDbOk && load();
  }, [isDbOk]);

  async function load() {
    setIsLoading(true);

    let result;

    if (tableName === TableNames.PATRIMONIO) {
      result = await repository.patrimonio.listByMonth(momentMonth.format('MM'), momentMonth.format('YYYY'));
    } else {
      result = await repository.transacoes.listByMonth(momentMonth.format('MM'), momentMonth.format('YYYY'));
    }


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

    if (isPatrimonio) {
      transacoesOk.forEach((x, i) => {
        delete x.categoriaId;
        delete x.tipo;
      });
    }

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
            <EditarEmMassaList trocarPosicao={trocarPosicao} transacoes={transacoes} tableName={tableName} removerTransacao={removerTransacao} setEditTransacao={setEditTransacao} />
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
      {isNewTransacaoOpen && (
        <Modal hideFooter={true} onClose={() => setIsNewTransacaoOpen(false)} title={`Adicionar transação`}>
          <TransacaoForm tableName={tableName} cleanStyle={true} onClose={() => setIsNewTransacaoOpen(false)} onCustomSubmit={x => addTransacao(x)} onCustomDelete={x => setIsNewTransacaoOpen(false)} />
        </Modal>
      )}
      {editTransacao && (
        <Modal hideFooter={true} onClose={() => setEditTransacao(null)} title={`Detalhes da transação: ${editTransacao?.local}`}>
          <TransacaoForm tableName={tableName} transacao={editTransacao} cleanStyle={true} onClose={() => setEditTransacao(null)} onCustomSubmit={x => salvarTransacao(editTransacao, x)} onCustomDelete={x => removerTransacao(editTransacao)} />
        </Modal>
      )}
    </>
  );
}
interface EditarEmMassaListProps {
  trocarPosicao: (drop: DropResult) => void;
  transacoes: Transacoes[];
  tableName: TableNames;
  removerTransacao: (transacao: Transacoes) => void;
  setEditTransacao: (transacao: Transacoes | null) => void;
}

function EditarEmMassaList({ trocarPosicao, transacoes, removerTransacao, tableName, setEditTransacao }: EditarEmMassaListProps) {
  return <>
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
                    <EditarEmMassaListItem provided={provided} item={x} tableName={tableName} snapshot={snapshot} setEditTransacao={setEditTransacao} removerTransacao={removerTransacao} />
                  )}
                </Draggable>
              ))}
            </ul>
            {provided.placeholder}
          </>
        )}
      </Droppable>
    </DragDropContext>
  </>
}

interface EditarEmMassaListItemProps {
  provided: any;
  tableName: TableNames;
  item: Transacoes;
  snapshot: any;
  setEditTransacao: (transacao: Transacoes | null) => void;
  removerTransacao: (transacao: Transacoes) => void;
}

function EditarEmMassaListItem({
  provided,
  item,
  snapshot,
  tableName,
  setEditTransacao,
  removerTransacao,
}: EditarEmMassaListItemProps) {
  const { repository } = useStorage();

  const isPatrimonio = tableName === TableNames.PATRIMONIO;
  const descricaoCategoriaOrDefault = isPatrimonio ? '' : `(${repository?.categoriaTransacoes?.TODAS_DICT[item.categoriaId]?.descricao || 'Sem categoria'})`;

  return (
    <li
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      style={provided.draggableProps.style}
      className={`list-group-item ${!item.valor?.toNumber() && 'list-group-item-warning'} ${snapshot.isDragging && 'active'}`}
    >
      <div className="d-flex w-100 justify-content-between gap-3">
        <h5>
          {item.local} <small className="text-secondary">{descricaoCategoriaOrDefault}</small>
        </h5>
        <div className="d-flex justify-content-between gap-3">
          <small>{moment(item.data).format('DD/MM/YY')}</small>
          {item.tipo !== undefined && (
            <small className={item.tipo === TipoDeReceita.FIXO ? 'text-primary' : 'text-info'}>
              {item.tipo === TipoDeReceita.FIXO ? 'Fixo' : 'Variável'}
            </small>
          )}
        </div>
      </div>
      <div className="d-flex w-100 justify-content-between gap-3">
        <p>{item.valor?.toNumber() ? NumberUtil.toCurrency(item.valor) : 'sem valor'}</p>
        <div className="d-flex gap-3 flex-column flex-lg-row">
          <button className="btn btn-secondary" onClick={e => setEditTransacao(item)}>
            Editar
          </button>
          <button className="btn btn-danger" onClick={e => removerTransacao(item)}>
            Remover
          </button>
        </div>
      </div>
      <small>{item.comentario}</small>
    </li>
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

