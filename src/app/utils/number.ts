import BigNumber from "bignumber.js";
import extenso from "extenso";
import { Options } from "./types.d";

const BRL = new Intl.NumberFormat('pt-br', {
  style: 'currency',
  currency: 'BRL',
});

const PERCENT = new Intl.NumberFormat('pt-br', {
  style: 'percent',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export class NumberUtil {
  public static bigNumberToNumber(obj: any): any {
    const nextObj = { ...obj };

    Object.keys(nextObj).forEach(key => {
      const val = nextObj[key]

      if (val instanceof BigNumber)
        nextObj[key] = val?.toNumber();
      else if (typeof (val) === 'object') {
        nextObj[key] = NumberUtil.bigNumberToNumber(val);
      }
    })

    return nextObj;
  }

  public static extenso(number?: number | string | BigNumber | null, options?: Options): string {
    if (number instanceof BigNumber)
      number = number?.integerValue()?.toNumber();

    if (number == null || isNaN(number as any) || !isFinite(number as any)) return '';

    return extenso(number, options);
  }

  public static toCurrency(number?: number | string | BigNumber | null): string {
    if (typeof (number) === 'string')
      number = Number(number);

    if (number instanceof BigNumber)
      number = number?.toNumber();

    if (number == null || isNaN(number as any) || !isFinite(number as any)) return '';

    return BRL.format(number);
  }

  public static toCurrencyAbbreviated(number?: number | string | BigNumber | null): string {
    if (typeof (number) === 'string')
      number = Number(number);

    if (number instanceof BigNumber)
      number = number?.toNumber();

    if (number == null || isNaN(number as any) || !isFinite(number as any)) return '';

    let nextNumber = number;
    let abbreviation = '';

    if (Math.abs(number) >= 1e9) {
      nextNumber = (number / 1e9);
      abbreviation = 'B';
    } else if (Math.abs(number) >= 1e6) {
      nextNumber = (number / 1e6);
      abbreviation = 'M';
    } else if (Math.abs(number) >= 1e3) {
      nextNumber = (number / 1e3);
      abbreviation = 'k';
    }

    return `${NumberUtil.toCurrency(nextNumber)}${abbreviation}`;
  }

  public static toPercent(number?: number | string | BigNumber | null, div: boolean = true): string {
    if (typeof (number) === 'string')
      number = Number(number);

    if (number instanceof BigNumber)
      number = number?.toNumber();

    if (number == null || isNaN(number as any) || !isFinite(number as any)) return '';

    if (div) number = number / 100;

    return PERCENT.format(number);
  }
}
