import BigNumber from "bignumber.js";
import extenso from "extenso";
import { Options } from "./types.d";

const BRL = new Intl.NumberFormat('pt-br', {
  style: 'currency',
  currency: 'BRL',
});

export class NumberUtil {
  public static extenso(number?: number | string | BigNumber | null, options?: Options): string {
    if (number instanceof BigNumber)
      number = number?.integerValue()?.toNumber();

    if (number == null || isNaN(number as any) || !isFinite(number as any)) return '';

    return extenso(number, options);
  }

  public static toCurrency(number?: number | string | BigNumber | null, options?: Options): string {
    if (typeof (number) === 'string')
      number = Number(number);

    if (number instanceof BigNumber)
      number = number?.toNumber();

    if (number == null || isNaN(number as any) || !isFinite(number as any)) return '';

    return BRL.format(number);
  }
}
