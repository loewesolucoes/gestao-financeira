"use client";
import { NumberUtil } from "@/app/utils/number";
import moment from "moment";
import { useEffect, useState } from "react";
import { Modal } from "@/app/components/modal";
import { TransacaoForm } from "./transacao-form";
import { TableNames } from "@/app/repositories/default";
import { TipoDeReceita, Transacoes } from "@/app/repositories/transacoes";
import { MarkdownUtils } from "@/app/utils/markdown";

interface CustomProps {
  transacoesDoPeriodo: Transacoes[]
  tableName?: TableNames
}

export function ListaCaixa({ transacoesDoPeriodo, tableName: tn }: CustomProps) {
  const tableName = tn || TableNames.TRANSACOES
  const [transaction, setTransaction] = useState<Transacoes | null>(null);

  return <ul className="list-group w-100 mx-3">
    {transacoesDoPeriodo.map((x, i) => (
      <ListaCaixaItem key={`${x.local}:${i}`} item={x} setTransaction={setTransaction} />
    ))}
    {transaction && (
      <Modal hideFooter={true} onClose={() => setTransaction(null)} title={`Detalhes da transação: ${transaction?.local}`}>
        <TransacaoForm tableName={tableName} transacao={transaction} cleanStyle={true} onClose={() => setTransaction(null)} />
      </Modal>
    )}
  </ul>;
}
function ListaCaixaItem({ item, setTransaction }: { item: Transacoes, setTransaction: (x: Transacoes) => void }) {
  const [parsedItem, setParsedItem] = useState<any>(item);

  useEffect(() => {
    const parsedItem = { ...item } as any;

    parsedItem.__parsedComentario = MarkdownUtils.render(item.comentario);

    setParsedItem(parsedItem);
  }, [item]);

  return <li className={`list-group-item ${item.valor ?? 'list-group-item-warning'}`}>
    <div className="d-flex w-100 justify-content-between gap-3">
      <h5>{item.local}</h5>
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

