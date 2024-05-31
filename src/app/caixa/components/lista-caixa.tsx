"use client";
import { NumberUtil } from "@/app/utils/number";
import { Transacoes, TipoDeReceita, TableNames } from "../../utils/db-repository";
import moment from "moment";
import { useState } from "react";
import { Modal } from "@/app/components/modal";
import { TransacaoForm } from "./transacao-form";

interface CustomProps {
  transacoesDoPeriodo: Transacoes[]
  tableName?: TableNames
}

export function ListaCaixa({ transacoesDoPeriodo, tableName: tn }: CustomProps) {
  const tableName = tn || TableNames.TRANSACOES
  const [transaction, setTransaction] = useState<Transacoes | null>(null);

  return <ul className="list-group">
    {transacoesDoPeriodo.map((x, i) => (
      <li key={`${x.local}:${i}`} className={`list-group-item ${x.valor ?? 'list-group-item-warning'}`}>
        <div className="d-flex w-100 justify-content-between gap-3">
          <h5>{x.local}</h5>
          <div className="d-flex justify-content-between gap-3 flex-column flex-lg-row">
            <small>{moment(x.data).format('DD/MM/YY')}</small>
            {x.tipo !== undefined && (
              <small className={x.tipo === TipoDeReceita.FIXO ? 'text-primary' : 'text-info'}>{x.tipo === TipoDeReceita.FIXO ? 'Fixo' : 'Variável'}</small>
            )}
          </div>
        </div>
        <div className="d-flex w-100 justify-content-between gap-3">
          <p>{x.valor ? NumberUtil.toCurrency(x.valor) : 'sem valor'}</p>
          <button className="btn btn-secondary" onClick={e => setTransaction(x)}>Editar</button>
        </div>
        <small>{x.comentario}</small>
      </li>
    ))}
    {transaction && (
      <Modal hideFooter={true} onClose={() => setTransaction(null)} title={`Detalhes da transação: ${transaction?.local}`}>
        <TransacaoForm tableName={tableName} transacao={transaction} cleanStyle={true} onClose={() => setTransaction(null)} />
      </Modal>
    )}
  </ul>;
}
