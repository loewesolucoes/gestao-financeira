import { Metas, TipoDeMeta } from "@/app/repositories/metas"
import { NumberUtil } from "@/app/utils/number"
import moment from "moment"
import IconMeta from '@material-design-icons/svg/outlined/emoji_events.svg';
import IconAtm from '@material-design-icons/svg/outlined/local_atm.svg';
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
    <div className="row g-3">
      <section className="col-12 col-xl-5 card-caixa">
        <div className="ps-balance h-100">
          <div>
            <span className="ps-overline">Valor em caixa</span>
            <div className="ps-balance-value">{NumberUtil.toCurrency(valorEmCaixa)}</div>
            <div className="ps-balance-meta">{NumberUtil.extenso(valorEmCaixa)}</div>
          </div>
          <div className="d-grid gap-1">
            <label htmlFor="data" className="ps-overline">Mês a aplicar</label>
            <Input type="month" className="form-control" id="data" value={yearAndMonth} onChange={x => setYearAndMonth(x)} />
          </div>
        </div>
      </section>
      <section className="col-12 col-md-6 col-xl-4">
        <div className="card card-material-1 h-100">
          <div className="card-body">
            <CardHeading icon={<IconAtm width={20} height={20} viewBox="0 0 24 24" fill="currentColor" />} title="Caixa do mês" subtitle={moment(yearAndMonth).format('MMMM YYYY')} />
            {sobra == null
              ? (<div className="alert alert-info" role="alert">Mês sem dados</div>)
              : (
                <div className="d-grid gap-3">
                  <Stat label="Receitas" value={receitas} />
                  <Stat label="Despesas" value={despesas} />
                  <Stat label="Sobra" value={sobra} />
                </div>
              )}
          </div>
        </div>
      </section>
      <section className="col-12 col-md-6 col-xl-3 card-metas">
        <div className="card card-material-1 h-100">
          <div className="card-body">
            <CardHeading icon={<IconMeta width={20} height={20} viewBox="0 0 24 24" fill="currentColor" />} title="Metas" />
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
        </div>
      </section>
    </div>
  )
}

// Card header with the design system icon chip (replaces the emoji/loose icon beside titles).
function CardHeading({ icon, title, subtitle }: { icon: React.ReactNode, title: string, subtitle?: string }) {
  return (
    <div className="d-flex align-items-center gap-3 mb-3">
      <span className="ps-icon-chip" aria-hidden="true">{icon}</span>
      <div>
        <h4 className="card-title m-0">{title}</h4>
        {subtitle && <div className="ps-card-sub">{subtitle}</div>}
      </div>
    </div>
  )
}

// StatCard: label, figure and amount in words. The figure stays in `ink`; semantic colour is reserved for deltas (ps-delta-*).
function Stat({ label, value }: { label: string, value: BigNumber }) {
  return (
    <div className="ps-stat">
      <div className="ps-stat-top">{label}</div>
      <div className="ps-stat-value">{NumberUtil.toCurrency(value)}</div>
      <div className="ps-stat-foot">{NumberUtil.extenso(value)}</div>
    </div>
  )
}
