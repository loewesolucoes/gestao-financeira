"use client";
import { PeriodoTransacoes } from "../../utils/db-repository";

const periodosTransacoes = [
  { title: 'ultimo mes', value: PeriodoTransacoes.ULTIMO_MES },
  { title: '3 ultimos meses', value: PeriodoTransacoes.TRES_ULTIMOS_MESES },
  { title: '6 ultimos meses', value: PeriodoTransacoes.SEIS_ULTIMOS_MESES },
  { title: 'ultimo ano', value: PeriodoTransacoes.ULTIMO_ANO },
  { title: 'todo historico', value: PeriodoTransacoes.TODO_HISTORICO },
];

export function PeriodoForm({ onChange, value }: any) {
  return <section>
    <h5>Escolha o periodo</h5>
    <div className="btn-group my-3">
      {periodosTransacoes.map((x, i) => (
        <label key={x.value} className={`btn btn-outline-secondary ${x.value === value && 'active'}`} htmlFor={`periodosTransacoes${i}`}>
          <input type="radio" className="btn-check" name="periodosTransacoes" id={`periodosTransacoes${i}`} value={x.value} onChange={e => onChange(Number(e.target.value))} checked={x.value === value} />
          {x.title}
        </label>
      ))}
    </div>
  </section>;
}
