import BigNumber from "bignumber.js";
import moment from "moment";
import { NumberUtil } from "../../utils/number";

export interface DiferencaPatrimonioBadgeProps {
  mesPatrimonio?: string;
  diferencaPatrimonioCaixa?: BigNumber;
}

export function DiferencaPatrimonioBadge({ mesPatrimonio, diferencaPatrimonioCaixa }: DiferencaPatrimonioBadgeProps) {
  if (mesPatrimonio == null)
    return null;

  const isPositivo = diferencaPatrimonioCaixa == null || diferencaPatrimonioCaixa.isGreaterThanOrEqualTo(0);

  return (
    <span
      className={`badge rounded-pill ${isPositivo ? 'text-bg-success' : 'text-bg-danger'} align-self-start text-wrap`}
      title={`Diferença entre o patrimônio de ${moment(mesPatrimonio, 'YYYY-MM').format('MMMM YYYY')} e o valor em caixa`}
    >
      Diferença ({moment(mesPatrimonio, 'YYYY-MM').format('MMMM YYYY')}): {NumberUtil.toCurrency(diferencaPatrimonioCaixa)}
    </span>
  );
}
