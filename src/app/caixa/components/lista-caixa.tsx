"use client";
import { NumberUtil } from "@/app/utils/number";
import { Caixa } from "../../utils/db-repository";

export function ListaCaixa({ periodo }: { periodo: Caixa[]; }) {
  return <ul className="list-group">
    {periodo.map((x, i) => (
      <li key={`${x.local}:${i}`} className="list-group-item">
        <div className="d-flex w-100 justify-content-between">
          <h5>{x.local}</h5>
          <small>{x.data.format('DD/MM/YY')}</small>
        </div>
        <p>{x.valor ? NumberUtil.toCurrency(x.valor) : 'sem valor'}</p>
      </li>
    ))}
  </ul>;
}
