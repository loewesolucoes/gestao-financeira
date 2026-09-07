import moment from "moment";
import { DefaultFields, DefaultRepository, MapperTypes, TableNames, DEFAULT_MAPPING } from './default';

export interface Notificacao extends DefaultFields {
  tipo: TipoDeNotificacao
  titulo?: string
  descricao?: string
  lida: boolean
  data: Date
}

export enum TipoDeNotificacao {
  NOTIFICACAO = 0, // bell — system/error alerts
  MENSAGEM = 1,    // envelope — informative app messages
}

export class NotificacoesRepository extends DefaultRepository {
  // @ts-ignore
  public readonly DEFAULT_MAPPING = { ...DEFAULT_MAPPING, data: MapperTypes.DATE_TIME, tipo: MapperTypes.NUMBER, lida: MapperTypes.BOOLEAN };

  public async listByTipo(tipo: TipoDeNotificacao): Promise<Notificacao[]> {
    const result = await this.db.exec(`select * from ${TableNames.NOTIFICACOES} where tipo = $tipo order by data desc`, { "$tipo": tipo });

    return this.parseSqlResultToObj(result, this.DEFAULT_MAPPING)[0] || [];
  }

  public async countUnread(tipo: TipoDeNotificacao): Promise<number> {
    const result = await this.db.exec(`select count(*) as total from ${TableNames.NOTIFICACOES} where tipo = $tipo and lida = 0`, { "$tipo": tipo });

    return Number(result?.[0]?.values?.[0]?.[0] ?? 0);
  }

  public async marcarComoLida(id: number): Promise<Notificacao> {
    return this.save(TableNames.NOTIFICACOES, { id, lida: true });
  }

  public async marcarTodasComoLidas(tipo: TipoDeNotificacao): Promise<void> {
    await this.db.exec(`update ${TableNames.NOTIFICACOES} set lida = 1, updatedDate = $updatedDate where tipo = $tipo and lida = 0`, {
      "$tipo": tipo,
      "$updatedDate": moment(new Date()).format(),
    });

    await this.persistDb();
  }

  public async limparLidas(diasRetencao?: number): Promise<void> {
    if (diasRetencao != null) {
      const limite = moment().subtract(diasRetencao, 'days').format();

      await this.db.exec(`delete from ${TableNames.NOTIFICACOES} where lida = 1 and updatedDate < $limite`, { "$limite": limite });
    } else {
      await this.db.exec(`delete from ${TableNames.NOTIFICACOES} where lida = 1`);
    }

    await this.persistDb();
  }
}
