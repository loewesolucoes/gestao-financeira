"use client";

import { PeriodoTransacoes } from "@/app/repositories/transacoes";

const periodosTransacoes = [
  { title: 'ultimo mes', value: PeriodoTransacoes.ULTIMO_MES },
  { title: '3 ultimos meses', value: PeriodoTransacoes.TRES_ULTIMOS_MESES },
  { title: '6 ultimos meses', value: PeriodoTransacoes.SEIS_ULTIMOS_MESES },
  { title: 'ultimo ano', value: PeriodoTransacoes.ULTIMO_ANO },
  { title: 'todo historico', value: PeriodoTransacoes.TODO_HISTORICO },
];

export function PeriodoForm({ onChange, value }: any) {
  return <form className="periodo-form card card-material-1">
    <h5 className="card-header">Escolha o periodo</h5>
    <div className="d-xl-none my-3 px-3">
      <select className="form-select" id="tipoReceita" onChange={e => onChange(Number(e.target.value))} defaultValue={value}>
        {periodosTransacoes.map((x, i) => (
          <option key={x.value} value={x.value}>{x.title}</option>
        ))}
      </select>
    </div>
    <div className="d-none d-xl-flex btn-group my-3 px-3">
      {periodosTransacoes.map((x, i) => (
        <label key={x.value} className={`btn btn-outline-secondary ${x.value === value && 'active'}`} htmlFor={`periodosTransacoes${i}`}>
          <input type="radio" className="btn-check" name="periodosTransacoes" id={`periodosTransacoes${i}`} value={x.value} onChange={e => onChange(Number(e.target.value))} checked={x.value === value} />
          {x.title}
        </label>
      ))}
    </div>
  </form>;
}
