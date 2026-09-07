import { TotaisEmprestimosDoMes, TipoDeEmprestimo } from "@/app/repositories/emprestimos"
import { NumberUtil } from "@/app/utils/number"
import moment from "moment"
import IconAtm from '@material-design-icons/svg/two-tone/local_atm.svg';

interface EmprestimosDoMesProps {
  totais: TotaisEmprestimosDoMes
  yearAndMonth: Date
}

export function EmprestimosDoMes({ totais, yearAndMonth }: EmprestimosDoMesProps) {
  const { aReceber, aPagar, parcelasDoMes } = totais || {};

  const parcelasAReceber = parcelasDoMes?.filter(p => p.tipo === TipoDeEmprestimo.EMPRESTEI) || [];
  const parcelasAPagar = parcelasDoMes?.filter(p => p.tipo === TipoDeEmprestimo.TOMEI_EMPRESTADO) || [];

  const semParcelas = parcelasAReceber.length === 0 && parcelasAPagar.length === 0;

  return (
    <section className="card card-emprestimos card-material-1">
      <div className="card-body">
        <h4 className="card-title">Empréstimos em {moment(yearAndMonth).format('MMMM YYYY')} <IconAtm width={30} height={30} viewBox="0 0 24 24" fill="var(--bs-primary)" /></h4>
        {semParcelas
          ? (<div className="alert alert-info" role="alert">Nenhuma parcela de empréstimo neste mês.</div>)
          : (
            <div className="d-flex flex-column flex-md-row gap-3">
              <div className="d-flex gap-3">
                <h5>A receber:</h5>
                <div className="d-flex flex-column">
                  <p className="m-0">{NumberUtil.toCurrency(aReceber)}</p>
                  <small>{parcelasAReceber.length} parcela(s)</small>
                </div>
              </div>
              <div className="d-flex gap-3">
                <h5>A pagar:</h5>
                <div className="d-flex flex-column">
                  <p className="m-0">{NumberUtil.toCurrency(aPagar)}</p>
                  <small>{parcelasAPagar.length} parcela(s)</small>
                </div>
              </div>
            </div>
          )}
      </div>
    </section>
  )
}
