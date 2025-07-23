"use client";
import { PeriodoTransacoes } from "../../repositories/transacoes";

const periodosTransacoes = [
  { title: '3 últimos meses', value: PeriodoTransacoes.TRES_ULTIMOS_MESES },
  { title: '6 últimos meses', value: PeriodoTransacoes.SEIS_ULTIMOS_MESES },
  { title: 'último ano', value: PeriodoTransacoes.ULTIMO_ANO },
  { title: '2 últimos anos', value: PeriodoTransacoes.DOIS_ULTIMOS_ANOS },
  { title: '3 últimos anos', value: PeriodoTransacoes.TRES_ULTIMOS_ANOS },
  { title: 'todo histórico', value: PeriodoTransacoes.TODO_HISTORICO },
];

export function PeriodoForm({ periodo, setPeriodo }: { periodo: PeriodoTransacoes; setPeriodo: (value: PeriodoTransacoes) => void; }) {
  return (
    <section className="card card-material-1 periodo-form">
      <form className="card-body">
        <h5 className="card-title">Escolha o periodo</h5>
        <div className="d-xl-none my-3 px-3">
          <select className="form-select" id="tipoReceita" onChange={e => setPeriodo(Number(e.target.value))} defaultValue={periodo}>
            {periodosTransacoes.map((x, i) => (
              <option key={x.value} value={x.value}>{x.title}</option>
            ))}
          </select>
        </div>
        <div className="d-none d-xl-flex btn-group my-3 px-3">
          {periodosTransacoes.map((x, i) => (
            <label key={x.value} className={`btn btn-outline-secondary ${x.value === periodo && 'active'}`} htmlFor={`periodosTransacoes${i}`}>
              <input type="radio" className="btn-check" name="periodosTransacoes" id={`periodosTransacoes${i}`} value={x.value} onChange={e => setPeriodo(Number(e.target.value))} checked={x.value === periodo} />
              {x.title}
            </label>
          ))}
        </div>
      </form>
    </section>
  );
}
