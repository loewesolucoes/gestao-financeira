interface BaseOptions {
  negative?: "formal" | "informal" | undefined;
  locale?: "br" | "pt" | undefined;
  scale?: "short" | "long" | undefined;
}
interface NumberModeOptions extends BaseOptions {
  mode?: "number" | undefined;
  number?: {
    gender?: "m" | "f" | undefined;
    decimal?: "formal" | "informal" | undefined;
  } | undefined;
}
interface CurrencyModeOptions extends BaseOptions {
  mode: "currency";
  currency?: {
    type?: "BRL" | "EUR" | undefined;
  } | undefined;
}

export type Options = NumberModeOptions | CurrencyModeOptions;


export enum TipoCustoConstrucao {
  CUB = "CUB",
  HISTORICO_INTERNO = "HISTORICO_INTERNO",
  ORCAMENTO = "ORCAMENTO",
}