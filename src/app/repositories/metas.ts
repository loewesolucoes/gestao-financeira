import { DefaultFields, DefaultRepository, MapperTypes } from './default';

export interface Metas extends DefaultFields {
  data: Date
  descricao?: string
  comentario?: string
  tipo?: TipoDeMeta
}

export enum TipoDeMeta {
  PESSOAL = 0,
  FINANCEIRA = 1,
}

export class MetasRepository extends DefaultRepository {
  public readonly NOTA_MAPPING = { ...this.DEFAULT_MAPPING, data: MapperTypes.DATE_TIME, tipo: MapperTypes.NUMBER, monthYear: MapperTypes.IGNORE };
}