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