import { Metas, TipoDeMeta } from "@/app/repositories/metas"
import { NumberUtil } from "@/app/utils/number"
import moment from "moment"
import IconMeta from '@material-design-icons/svg/two-tone/emoji_events.svg';
import IconAtm from '@material-design-icons/svg/two-tone/local_atm.svg';
import { Input } from "@/app/components/input";

interface HomeCashAndGoalsProps {
  valorEmCaixa: BigNumber,
  yearAndMonth: Date,
  setYearAndMonth: (date: Date) => void,
  metas: Metas[],
  sobra: BigNumber,
  receitas: BigNumber,
  despesas: BigNumber
}

export function HomeCashAndGoals({ valorEmCaixa, yearAndMonth, setYearAndMonth, metas, sobra, receitas, despesas }: HomeCashAndGoalsProps) {
  return (
    <div className="d-flex flex-column flex-xl-row gap-3">
      <section className="card card-caixa card-material-1">
        <div className="card-body">
          <h4 className="card-title">Caixa Geral <IconAtm width={30} height={30} viewBox="0 0 24 24" fill="var(--bs-primary)" /></h4>
          <div className="d-flex gap-3">
            <h5>Valor em caixa</h5>
            <div className="d-flex flex-column">
              <p className="m-0">{NumberUtil.toCurrency(valorEmCaixa)}</p>
              <small>{NumberUtil.extenso(valorEmCaixa)}</small>
            </div>
          </div>
          <div className="d-flex gap-3 mt-3 flex-column flex-xlg-row">
            <h5>Escolha um mês</h5>
            <div className="form-floating">
              <Input type="month" className="form-control" id="data" placeholder="Mês a aplicar" value={yearAndMonth} onChange={x => setYearAndMonth(x)} />
              <label htmlFor="data" className="form-label">Mês a aplicar</label>
            </div>
          </div>
        </div>
      </section>
      <section className="card card-metas card-material-1">
        <div className="card-body">
          <h4 className="card-title">Metas <IconMeta width={30} height={30} viewBox="0 0 24 24" fill="var(--bs-primary)" /></h4>
          {(metas == null || metas.length === 0) && (<div className="alert alert-info" role="alert">Nenhuma meta cadastrada no ano.</div>)}
          <ul className="list-group">
            {metas?.map((x, i) => (
              <li key={`${x.data}:${x.descricao}:${i}`} className={`list-group-item ${x.descricao == null ? 'list-group-item-info' : ''} ${x.tipo === TipoDeMeta.PESSOAL ? 'list-group-item-success' : ''}  ${x.tipo === TipoDeMeta.FINANCEIRA ? 'list-group-item-warning' : ''}`}>
                <div className="d-flex w-100 justify-content-between gap-3">
                  <div className="d-flex flex-column gap-3">
                    <h6>{x.descricao}</h6>
                  </div>
                  <div className="d-flex flex-column gap-3">
                    <small>{moment(x.data).format('MMMM YYYY')}</small>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <section className="card card-material-1">
        <div className="card-body">
          <h4 className="card-title">Caixa do mês: {moment(yearAndMonth).format('MMMM YYYY')}</h4>
          {sobra == null
            ? (<div className="alert alert-info" role="alert">Mês sem dados</div>)
            : (
              <>
                <div className="d-flex gap-3">
                  <h5>Receitas:</h5>
                  <div className="d-flex flex-column">
                    <p className="m-0">{NumberUtil.toCurrency(receitas)}</p>
                    <small>{NumberUtil.extenso(receitas)}</small>
                  </div>
                </div>
                <div className="d-flex gap-3">
                  <h5>Depesas:</h5>
                  <div className="d-flex flex-column">
                    <p className="m-0">{NumberUtil.toCurrency(despesas)}</p>
                    <small>{NumberUtil.extenso(despesas)}</small>
                  </div>
                </div>
                <div className="d-flex gap-3">
                  <h5>Sobra:</h5>
                  <div className="d-flex flex-column">
                    <p className="m-0">{NumberUtil.toCurrency(sobra)}</p>
                    <small>{NumberUtil.extenso(sobra)}</small>
                  </div>
                </div>
              </>
            )}
        </div>
      </section>
    </div>
  )
}