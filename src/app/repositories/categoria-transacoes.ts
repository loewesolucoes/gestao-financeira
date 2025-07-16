import { IDatabase } from './database-connector';
import { DefaultFields, DefaultRepository, MapperTypes, TableNames, DEFAULT_MAPPING } from './default';

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
  public readonly DEFAULT_MAPPING = { ...DEFAULT_MAPPING, descricao: MapperTypes.TEXT, tipo: MapperTypes.NUMBER, active: MapperTypes.BOOLEAN };
  public readonly TODAS: CategoriaTransacoes[];
  public readonly TODAS_DICT: Record<string, CategoriaTransacoes>;

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
    //@ts-ignore
    this.TODAS_DICT = this.TODAS.reduce((acc, categoria) => {
      acc[categoria.id] = categoria;
      return acc;
    }, {} as Record<string, CategoriaTransacoes>);

    console.debug('loaded', this.TODAS.length, 'categorias de transações');
  }
}