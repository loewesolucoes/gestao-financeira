import { EnumUtil } from "../enum";
import { TipoDeMeta } from "@/app/repositories/metas";

describe("EnumUtil", () => {
  describe("keyFromValue", () => {
    it("retorna a chave correspondente ao valor numérico do enum", () => {
      expect(EnumUtil.keyFromValue(TipoDeMeta, TipoDeMeta.PESSOAL)).toBe("PESSOAL");
      expect(EnumUtil.keyFromValue(TipoDeMeta, TipoDeMeta.FINANCEIRA)).toBe("FINANCEIRA");
    });

    it("retorna undefined quando o valor não existe no enum", () => {
      expect(EnumUtil.keyFromValue(TipoDeMeta, 999)).toBeUndefined();
    });
  });

  describe("values", () => {
    it("retorna apenas as chaves textuais (nomes) do enum numérico", () => {
      expect(EnumUtil.values(TipoDeMeta)).toEqual(["PESSOAL", "FINANCEIRA"]);
    });
  });
});
