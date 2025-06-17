import { DefaultFields, DefaultRepository, MapperTypes } from './default';

export interface Notas extends DefaultFields {
  data: Date
  descricao?: string
  comentario?: string
  tipo?: TipoDeNota
}

export enum TipoDeNota {
  NORMAL = 0,
  PRIMARY = 1,
  SECONDARY = 2,
  INFO = 3,
  SUCCESS = 4,
  WARNING = 5,
  DANGER = 6,
  LIGHT = 7,
  DARK = 8,
}

export class NotasRepository extends DefaultRepository {
  // @ts-ignore
  public readonly DEFAULT_MAPPING = { ...super.DEFAULT_MAPPING, data: MapperTypes.DATE_TIME, tipo: MapperTypes.NUMBER, monthYear: MapperTypes.IGNORE };
}