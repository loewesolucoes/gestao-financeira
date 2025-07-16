"use client";
import { NumberUtil } from "@/app/utils/number";
import moment from "moment";
import { useEffect, useState } from "react";
import { Modal } from "@/app/components/modal";
import { TransacaoForm } from "./transacao-form";
import { TableNames } from "@/app/repositories/default";
import { TipoDeReceita, Transacoes } from "@/app/repositories/transacoes";
import { MarkdownUtils } from "@/app/utils/markdown";
import { BigNumber } from "bignumber.js";
import { useStorage } from "@/app/contexts/storage";

interface CustomProps {
  transacoesDoPeriodo: Transacoes[]
  tableName?: TableNames
}

export function ListaCaixa({ transacoesDoPeriodo, tableName: tn }: CustomProps) {
  const tableName = tn || TableNames.TRANSACOES
  const isCaixa = tableName === TableNames.TRANSACOES;
  const [transaction, setTransaction] = useState<Transacoes | null>(null);

  const receitas = transacoesDoPeriodo.filter(x => x?.valor?.isGreaterThan(0));
  const somaTotalReceitas = receitas?.reduce((p, n) => p.plus(n.valor), new BigNumber(0));
  const despesas = transacoesDoPeriodo.filter(x => x?.valor?.isLessThanOrEqualTo(0));
  const somaTotalDespesas = despesas?.reduce((p, n) => p.plus(n.valor), new BigNumber(0));
  const cadastroIncompleto = transacoesDoPeriodo.filter(x => !x?.valor);

  return (
    <section className="d-flex lista-caixa w-100 gap-3 flex-column">
      {isCaixa ? (
        <>
          <ul className="list-group list-group-material-1 w-100">
            <li className="list-group-item list-group-item-success">Receitas (Soma: {NumberUtil.toCurrency(somaTotalReceitas)})</li>
            {receitas.length === 0 && <li className="list-group-item list-group-item-warning">Nenhuma receita encontrada</li>}
            {receitas.map((x, i) => (<ListaCaixaItem key={`${x.local}:${i}`} item={x} setTransaction={setTransaction} />))}
          </ul>
          <ul className="list-group list-group-material-1 w-100">
            <li className="list-group-item list-group-item-danger">Despesas (Soma: {NumberUtil.toCurrency(somaTotalDespesas)})</li>
            {despesas.length === 0 && <li className="list-group-item list-group-item-warning">Nenhuma despesa encontrada</li>}
            {despesas.map((x, i) => (<ListaCaixaItem key={`${x.local}:${i}`} item={x} setTransaction={setTransaction} />))}
          </ul>
          <ul className="list-group list-group-material-1 w-100">
            {cadastroIncompleto.length > 0 && (
              <>
                <li className="list-group-item list-group-item-warning">Cadastro incompleto</li>
                {cadastroIncompleto.map((x, i) => (
                  <ListaCaixaItem key={`${x.local}:${i}`} item={x} setTransaction={setTransaction} />
                ))}
              </>
            )}
          </ul>
        </>
      ) : (
        <ul className="list-group list-group-material-1 w-100">
          {transacoesDoPeriodo.map((x, i) => (
            <ListaCaixaItem key={`${x.local}:${i}`} item={x} setTransaction={setTransaction} />
          ))}
        </ul>
      )}
      {transaction && (
        <Modal hideFooter={true} onClose={() => setTransaction(null)} title={`Detalhes da transação: ${transaction?.local}`}>
          <TransacaoForm tableName={tableName} transacao={transaction} cleanStyle={true} onClose={() => setTransaction(null)} />
        </Modal>
      )}
    </section>
  )
}

function ListaCaixaItem({ item, setTransaction, tableName }: { item: Transacoes, setTransaction: (x: Transacoes) => void, tableName?: TableNames }) {
  const { repository } = useStorage();
  const [parsedItem, setParsedItem] = useState<any>(item);
  const isCaixa = tableName === TableNames.TRANSACOES;

  const descricaoCategoriaOrDefault = isCaixa ? `(${repository?.categoriaTransacoes?.TODAS_DICT[item.categoriaId]?.descricao || 'Sem categoria'})` : '';

  useEffect(() => {
    const parsedItem = { ...item } as any;

    parsedItem.__parsedComentario = MarkdownUtils.render(item.comentario);

    setParsedItem(parsedItem);
  }, [item]);

  return <li className={`list-group-item ${item.valor ?? 'list-group-item-warning'}`}>
    <div className="d-flex w-100 justify-content-between gap-3">
      <h5>{item.local} <small className="text-secondary">{descricaoCategoriaOrDefault}</small></h5>
      <div className="d-flex justify-content-between gap-3 flex-column flex-lg-row">
        <small>{moment(item.data).format('DD/MM/YY')}</small>
        {item.tipo !== undefined && (
          <small className={item.tipo === TipoDeReceita.FIXO ? 'text-primary' : 'text-info'}>{item.tipo === TipoDeReceita.FIXO ? 'Fixo' : 'Variável'}</small>
        )}
      </div>
    </div>
    <div className="d-flex w-100 justify-content-between gap-3">
      <p>{item.valor ? NumberUtil.toCurrency(item.valor) : 'sem valor'}</p>
      <button className="btn btn-secondary" onClick={e => setTransaction(item)}>Editar</button>
    </div>
    <small dangerouslySetInnerHTML={{ __html: parsedItem.__parsedComentario }} />
  </li>;
}

