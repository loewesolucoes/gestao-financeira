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

  // Arredonda para centavos antes de comparar com zero, para evitar mostrar
  // algo como "-R$ 0,00" quando a diferença é infinitesimal (ex.: erro de
  // arredondamento de ponto flutuante) mas seria exibida como zero.
  const semDiferenca = diferencaPatrimonioCaixa == null
    || diferencaPatrimonioCaixa.decimalPlaces(2, BigNumber.ROUND_HALF_UP).isZero();

  return (
    <span
      className="badge rounded-pill text-bg-info align-self-center text-wrap"
      title={`Diferença entre o patrimônio de ${moment(mesPatrimonio, 'YYYY-MM').format('MMMM YYYY')} e o valor em caixa`}
    >
      Diferença ({moment(mesPatrimonio, 'YYYY-MM').format('MMMM YYYY')}): {semDiferenca ? 'Sem diferença' : NumberUtil.toCurrency(diferencaPatrimonioCaixa)}
    </span>
  );
}
