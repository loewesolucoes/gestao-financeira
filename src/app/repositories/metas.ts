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
  // @ts-ignore
  public readonly DEFAULT_MAPPING = { ...super.DEFAULT_MAPPING, data: MapperTypes.DATE_TIME, tipo: MapperTypes.NUMBER, monthYear: MapperTypes.IGNORE };
}