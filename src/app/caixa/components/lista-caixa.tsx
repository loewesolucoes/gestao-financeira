"use client";
import { NumberUtil } from "@/app/utils/number";
import { Caixa, TipoDeReceita } from "../../utils/db-repository";
import moment from "moment";

export function ListaCaixa({ periodo }: { periodo: Caixa[]; }) {
  return <ul className="list-group">
    {periodo.map((x, i) => (
      <li key={`${x.local}:${i}`} className={`list-group-item ${x.valor ?? 'list-group-item-info'}`}>
        <div className="d-flex w-100 justify-content-between">
          <h5>{x.local}</h5>
          <small>{moment(x.data).format('DD/MM/YY')}</small>
        </div>
        <div className="d-flex w-100 justify-content-between">
          <p>{x.valor ? NumberUtil.toCurrency(x.valor) : 'sem valor'}</p>
          <p>{x.tipo === TipoDeReceita.FIXO ? 'Fixo' : 'Variável'}</p>
        </div>
        <small>{x.comentario}</small>
      </li>
    ))}
  </ul>;
}
