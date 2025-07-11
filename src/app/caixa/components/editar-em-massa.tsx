import BigNumber from "bignumber.js";
import moment from "moment";

import { useRouter } from "next/navigation";
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from '@dnd-kit/utilities';
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { DndContext, MouseSensor, PointerSensor, TouchSensor, UniqueIdentifier, useDroppable, useSensor, useSensors } from "@dnd-kit/core";

import { Input } from "@/app/components/input";
import { Loader } from "@/app/components/loader";
import { Modal } from "@/app/components/modal";
import { NumberUtil } from "@/app/utils/number";
import { TableNames } from "@/app/repositories/default";
import { TipoDeReceita, Transacoes } from "@/app/repositories/transacoes";
import { TransacaoForm } from "./transacao-form";
import { useLocation } from "@/app/contexts/location";
import { useStorage } from "@/app/contexts/storage";

interface CustomProps {
  tableName?: TableNames
  isCopy?: boolean
}

interface CustomTransacao extends Transacoes {
  __dndId?: string;
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
  const [receitas, setReceitas] = useState<CustomTransacao[]>([]);
  const [despesas, setDespesas] = useState<CustomTransacao[]>([]);
  const [semValor, setSemValor] = useState<CustomTransacao[]>([]);
  const [total, setTotal] = useState<BigNumber>(new BigNumber(0));

  const isPatrimonio = tableName === TableNames.PATRIMONIO;

  useEffect(() => {
    isDbOk && load();
  }, [isDbOk]);

  useEffect(() => {
    if (Array.isArray(transacoes)) {
      const nextTransactions = transacoes.map((x, i) => ({ ...x, __dndId: `${x.id}:${i}:${x.local}:${x.createdDate?.toISOString()}` }));
      const receitas = nextTransactions.filter(x => x?.valor?.isGreaterThan(0));
      const despesas = nextTransactions.filter(x => x?.valor?.isLessThanOrEqualTo(0));
      const semValor = nextTransactions.filter(x => x?.valor == null || x?.valor?.isNaN() || x?.valor?.isZero());
      const total = nextTransactions.filter(x => x?.valor).reduce((p, n) => { return n.valor.plus(p); }, BigNumber(0));

      setReceitas(receitas);
      setDespesas(despesas);
      setSemValor(semValor);
      setTotal(total);
    }
  }, [transacoes]);

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

    const transacoesOk = getAllTransactions();

    if (isCopy) {
      transacoesOk.forEach(x => {
        x.data = x.data === todayDate ? yearAndMonth : x.data;
      });
    }

    transacoesOk.forEach((x, i) => {
      x.ordem = i;
      delete x.__dndId;
    });

    if (isPatrimonio) {
      transacoesOk.forEach((x) => {
        delete x.categoriaId;
        delete x.tipo;
      });
    }

    await Promise.all(transacoesRemovidas.filter(x => x.id).map(x => repository.delete(tableName, x.id)))
    await repository.saveAll(tableName, transacoesOk);

    setIsLoading(false);

    console.log('transacoesOk', transacoesOk);

    router.push(isPatrimonio ? '/patrimonio' : '/caixa');
  }

  function getAllTransactions() {
    return [...receitas, ...despesas, ...semValor];
  }

  function removerTransacao(removedTransaction: Transacoes) {
    const oldTransacoes = getAllTransactions();
    const index = oldTransacoes.indexOf(removedTransaction);

    const nextTransacoes = [...oldTransacoes];

    nextTransacoes.splice(index, 1);
    setTransacoes(nextTransacoes);
    setTransacoesRemovidas(tr => ([...tr, removedTransaction]));
  }

  function salvarTransacao(previousTransacao: Transacoes, nextTransacao: Transacoes) {
    const oldTransacoes = getAllTransactions();
    const index = oldTransacoes.indexOf(previousTransacao);

    const nextTransacoes = [...oldTransacoes];

    nextTransacoes[index] = { ...nextTransacao };
    setTransacoes(nextTransacoes);
  }

  function addTransacao(newTransaction: Transacoes) {
    const oldTransacoes = getAllTransactions();
    const nextTransacoes = [...oldTransacoes];

    nextTransacoes.push(newTransaction);
    setTransacoes(nextTransacoes);
  }

  return (
    <>
      {isLoading
        ? <Loader className="align-self-center my-5" />
        : (
          <>
            <div className="d-flex justify-content-between align-items-center align-items-lg-end flex-column flex-lg-row gap-3">
              <BalancoMes total={total} />
              <div className="d-flex gap-3 flex-column flex-lg-row">
                <button type="button" className="btn btn-dark" onClick={() => setIsNewTransacaoOpen(true)}>Adicionar nova</button>
              </div>
            </div>
            <EditarEmMassaList tipo="receitas" transacoes={receitas} onChange={setReceitas} tableName={tableName} removerTransacao={removerTransacao} setEditTransacao={setEditTransacao} />
            <EditarEmMassaList tipo="despesas" transacoes={despesas} onChange={setDespesas} tableName={tableName} removerTransacao={removerTransacao} setEditTransacao={setEditTransacao} />
            <EditarEmMassaList tipo="semValor" transacoes={semValor} onChange={setSemValor} tableName={tableName} removerTransacao={removerTransacao} setEditTransacao={setEditTransacao} />
            <div className="d-flex justify-content-center justify-content-lg-end">
              <div className="d-flex gap-3 flex-column flex-lg-row">
                <BalancoMes total={total} />
                {isCopy && (
                  <div className="form-floating">
                    <Input type="month" className="form-control" id="data" placeholder="Mês a aplicar" value={yearAndMonth} onChange={x => setYearAndMonth(x)} />
                    <label htmlFor="data" className="form-label">Mês a aplicar</label>
                  </div>
                )}
                <button type="button" className="btn btn-primary" onClick={() => save()}>{isCopy ? 'Copiar transações para o mês' : 'Salvar transações do mês'}</button>
              </div>
            </div>
          </>
        )}
      {isNewTransacaoOpen && (
        <Modal hideFooter={true} onClose={() => setIsNewTransacaoOpen(false)} title={`Adicionar transação`}>
          <TransacaoForm tableName={tableName} cleanStyle={true} onClose={() => setIsNewTransacaoOpen(false)} onCustomSubmit={x => addTransacao(x)} onCustomDelete={() => setIsNewTransacaoOpen(false)} />
        </Modal>
      )}
      {editTransacao && (
        <Modal hideFooter={true} onClose={() => setEditTransacao(null)} title={`Detalhes da transação: ${editTransacao?.local}`}>
          <TransacaoForm tableName={tableName} transacao={editTransacao} cleanStyle={true} onClose={() => setEditTransacao(null)} onCustomSubmit={x => salvarTransacao(editTransacao, x)} onCustomDelete={() => removerTransacao(editTransacao)} />
        </Modal>
      )}
    </>
  );
}
interface EditarEmMassaListProps {
  transacoes: CustomTransacao[];
  onChange: Dispatch<SetStateAction<CustomTransacao[]>>;
  tableName: TableNames;
  removerTransacao: (transacao: CustomTransacao) => void;
  setEditTransacao: (transacao: CustomTransacao | null) => void;
  tipo?: 'receitas' | 'despesas' | 'semValor';
}

function EditarEmMassaList({ transacoes, onChange, removerTransacao, tableName, setEditTransacao, tipo }: EditarEmMassaListProps) {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { distance: 5 } }),
  );

  function handleDragEnd(event) {
    const { active, over } = event;

    if (active.id !== over.id) {
      onChange((items: CustomTransacao[]) => {
        const oldIndex = items.findIndex(x => x.__dndId === active.id);
        const newIndex = items.findIndex(x => x.__dndId === over.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }

    setIsDragging(false);
  }

  return <DndContext onDragEnd={handleDragEnd} onDragStart={() => setIsDragging(true)} sensors={sensors}>
    <SortableContext items={transacoes.map(x => ({ ...x, id: x.__dndId }))} strategy={verticalListSortingStrategy}>
      <Droppable droppableId='droppable' isDragging={isDragging}>
        {tipo === 'receitas' && <li className="list-group-item list-group-item-success">Receitas</li>}
        {tipo === 'despesas' && <li className="list-group-item list-group-item-danger">Despesas</li>}
        {tipo === 'semValor' && <li className="list-group-item list-group-item-warning">Sem Valor</li>}
        {transacoes.map((x, i) => (
          <SortableItem id={x.__dndId} key={x?.__dndId || i}>
            <EditarEmMassaListItem item={x} tableName={tableName} setEditTransacao={setEditTransacao} removerTransacao={removerTransacao} />
          </SortableItem>
        ))}
      </Droppable>
    </SortableContext>
  </DndContext>
}

function Droppable({ droppableId, isDragging, children }: { droppableId?: UniqueIdentifier; isDragging: boolean; children: React.ReactNode }) {
  const { setNodeRef } = useDroppable({
    id: droppableId || 'droppable',
  });

  return (
    <ul ref={setNodeRef}
      className={`list-group ${isDragging && 'text-bg-dark'}`}
    >
      {children}
    </ul>
  );
}

export function SortableItem(props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: props.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    touchAction: 'none',
  };

  return (
    <li
      className={`list-group-item`}
      ref={setNodeRef} style={style} {...listeners} {...attributes}
    >
      {props.children}
    </li>
  );
}

interface EditarEmMassaListItemProps {
  tableName: TableNames;
  item: Transacoes;
  setEditTransacao: (transacao: Transacoes | null) => void;
  removerTransacao: (transacao: Transacoes) => void;
}

function EditarEmMassaListItem({
  item,
  tableName,
  setEditTransacao,
  removerTransacao,
}: EditarEmMassaListItemProps) {
  const { repository } = useStorage();

  const isPatrimonio = tableName === TableNames.PATRIMONIO;
  const descricaoCategoriaOrDefault = isPatrimonio ? '' : `(${repository?.categoriaTransacoes?.TODAS_DICT[item.categoriaId]?.descricao || 'Sem categoria'})`;

  return (
    <>
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
          <button className="btn btn-secondary" onClick={() => setEditTransacao(item)}>
            Editar
          </button>
          <button className="btn btn-danger" onClick={() => removerTransacao(item)}>
            Remover
          </button>
        </div>
      </div>
      <small>{item.comentario}</small>
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

