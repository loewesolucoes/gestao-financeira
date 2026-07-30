import BigNumber from "bignumber.js";
import { NumberUtil } from "../number";

describe("NumberUtil", () => {
  describe("bigNumberToNumber", () => {
    it("converte campos BigNumber de nível superior para number", () => {
      const result = NumberUtil.bigNumberToNumber({ valor: BigNumber(100), outro: "texto" });

      expect(result.valor).toBe(100);
      expect(typeof result.valor).toBe("number");
      expect(result.outro).toBe("texto");
    });

    it("converte campos BigNumber aninhados recursivamente", () => {
      const result = NumberUtil.bigNumberToNumber({ nivel1: { valor: BigNumber(50), nivel2: { valor: BigNumber(25) } } });

      expect(result.nivel1.valor).toBe(50);
      expect(result.nivel1.nivel2.valor).toBe(25);
    });

    it("não altera o objeto original", () => {
      const original = { valor: BigNumber(10) };
      NumberUtil.bigNumberToNumber(original);

      expect(original.valor).toBeInstanceOf(BigNumber);
    });
  });

  describe("extenso", () => {
    it("converte um número em texto por extenso", () => {
      expect(NumberUtil.extenso(1)).toBe("um");
    });

    it("converte um BigNumber em texto por extenso (arredondando para inteiro)", () => {
      expect(NumberUtil.extenso(BigNumber(2.7))).toBe("três");
    });

    it("retorna string vazia para null", () => {
      expect(NumberUtil.extenso(null)).toBe("");
    });

    it("retorna string vazia para undefined", () => {
      expect(NumberUtil.extenso(undefined)).toBe("");
    });

    it("retorna string vazia para NaN", () => {
      expect(NumberUtil.extenso(NaN)).toBe("");
    });

    it("retorna string vazia para Infinity", () => {
      expect(NumberUtil.extenso(Infinity)).toBe("");
    });
  });

  describe("toCurrency", () => {
    it("formata um number como moeda BRL", () => {
      expect(NumberUtil.toCurrency(1000)).toBe("R$\u00A01.000,00");
    });

    it("formata uma string numérica como moeda BRL", () => {
      expect(NumberUtil.toCurrency("1000")).toBe("R$\u00A01.000,00");
    });

    it("formata um BigNumber como moeda BRL", () => {
      expect(NumberUtil.toCurrency(BigNumber(1000))).toBe("R$\u00A01.000,00");
    });

    it("retorna string vazia para null", () => {
      expect(NumberUtil.toCurrency(null)).toBe("");
    });

    it("retorna string vazia para NaN", () => {
      expect(NumberUtil.toCurrency(NaN)).toBe("");
    });

    it("retorna string vazia para Infinity", () => {
      expect(NumberUtil.toCurrency(Infinity)).toBe("");
    });
  });

  describe("toCurrencyAbbreviated", () => {
    it("não abrevia valores abaixo de mil", () => {
      expect(NumberUtil.toCurrencyAbbreviated(500)).toBe("R$\u00A0500,00");
    });

    it("abrevia valores na casa dos milhares com 'k'", () => {
      expect(NumberUtil.toCurrencyAbbreviated(1500)).toBe("R$\u00A01,50k");
    });

    it("abrevia valores na casa dos milhões com 'M'", () => {
      expect(NumberUtil.toCurrencyAbbreviated(2_500_000)).toBe("R$\u00A02,50M");
    });

    it("abrevia valores na casa dos bilhões com 'B'", () => {
      expect(NumberUtil.toCurrencyAbbreviated(3_000_000_000)).toBe("R$\u00A03,00B");
    });

    it("retorna string vazia para null/NaN/Infinity", () => {
      expect(NumberUtil.toCurrencyAbbreviated(null)).toBe("");
      expect(NumberUtil.toCurrencyAbbreviated(NaN)).toBe("");
      expect(NumberUtil.toCurrencyAbbreviated(Infinity)).toBe("");
    });
  });

  describe("toPercent", () => {
    it("divide por 100 por padrão", () => {
      expect(NumberUtil.toPercent(50)).toBe("50,00%");
    });

    it("não divide quando div é false", () => {
      expect(NumberUtil.toPercent(0.5, false)).toBe("50,00%");
    });

    it("aceita string e BigNumber", () => {
      expect(NumberUtil.toPercent("25")).toBe("25,00%");
      expect(NumberUtil.toPercent(BigNumber(10))).toBe("10,00%");
    });

    it("retorna string vazia para null/NaN/Infinity", () => {
      expect(NumberUtil.toPercent(null)).toBe("");
      expect(NumberUtil.toPercent(NaN)).toBe("");
      expect(NumberUtil.toPercent(Infinity)).toBe("");
    });
  });
});
