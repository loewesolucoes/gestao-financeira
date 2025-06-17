import { IDatabase } from './database-connector';
import { DefaultFields, DefaultRepository, MapperTypes, TableNames } from './default';

export interface CategoriaTransacoes extends DefaultFields {
  descricao: string;
  comentario?: string;
  tipo?: TipoDeCategoriaTransacao; // 0 - Pessoal, 1 - Financeira
  active?: boolean;
  categoriaId: number;
}

export enum TipoDeCategoriaTransacao {
  PESSOAL = 0,
  FINANCEIRA = 1,
}

export class CategoriaTransacoesRepository extends DefaultRepository {
  // @ts-ignore
  public readonly DEFAULT_MAPPING = { ...super.DEFAULT_MAPPING, descricao: MapperTypes.TEXT, tipo: MapperTypes.NUMBER, active: MapperTypes.BOOLEAN };
  public readonly TODAS: CategoriaTransacoes[];

  public static async create(db: IDatabase): Promise<CategoriaTransacoesRepository> {
    console.debug('CategoriaTransacoesRepository.create');

    const instance = new CategoriaTransacoesRepository(db);

    await instance.loadAll();

    return instance;
  }

  protected constructor(protected db: IDatabase) { super(db) }

  public async loadAll() {
    console.debug('loading categorias de transações...');
    //@ts-ignore
    this.TODAS = await this.list(TableNames.CATEGORIA_TRANSACOES);
    console.debug('loaded', this.TODAS.length, 'categorias de transações');
  }
}