"use client";


import React, { createContext, useState, useEffect } from "react"
import { useAuth } from "./auth";
import { GDriveUserInfo, GDriveUtil } from "../utils/gdrive";
import { RepositoryUtil } from "../utils/repository";
import { DefaultRepository } from "../repositories/default";
import { GOOGLE_DRIVE_REFRESH_TOKEN, ParametrosRepository } from "../repositories/parametros";
import { NotificationUtil } from "../utils/notification";
import { MetasRepository } from "../repositories/metas";
import { NotasRepository } from "../repositories/notas";
import { TransacoesRepository } from "../repositories/transacoes";
import { PatrimonioRepository } from "../repositories/patrimonio";
import { CategoriaTransacoesRepository } from "../repositories/categoria-transacoes";
import { AuthUtil } from "../utils/auth";

interface Repo extends DefaultRepository {
  params: ParametrosRepository
  metas: MetasRepository
  notas: NotasRepository
  transacoes: TransacoesRepository
  patrimonio: PatrimonioRepository
  categoriaTransacoes: CategoriaTransacoesRepository
}

interface StorageProviderContext {
  repository: Repo
  isDbOk: boolean
  isGDriveSaveLoading: boolean
  isGDriveLoadLoading: boolean
  doGDriveSave: () => Promise<void>
  doGDriveLoad: () => Promise<void>
  exportOriginalDumpToFileAndDownload: (fileName: string) => Promise<void>
  importOriginalDumpFromFile: (file?: File) => Promise<void>
  refresh: () => Promise<void>
}

const StorageContext = createContext<StorageProviderContext>({
  repository: {} as any,
  isDbOk: false,
  isGDriveSaveLoading: false,
  isGDriveLoadLoading: false,
  doGDriveSave: () => Promise.resolve(),
  doGDriveLoad: () => Promise.resolve(),
  exportOriginalDumpToFileAndDownload: () => Promise.resolve(),
  importOriginalDumpFromFile: () => Promise.resolve(),
  refresh: () => Promise.resolve(),
});

export function StorageProvider(props: any) {
  const [repository, setRepository] = useState<Repo>({} as any);
  const [isDbOk, setIsDbOk] = useState<boolean>(false);
  const [isGDriveSaveLoading, setIsGDriveSaveLoading] = useState<boolean>(false);
  const [isGDriveLoadLoading, setIsGDriveLoadLoading] = useState<boolean>(false);
  const { isAuthOk, loadRefreshIfExists } = useAuth();

  useEffect(() => {
    startStorage();
  }, []);

  useEffect(() => {
    isDbOk && reload();
  }, [isDbOk]);

  async function startStorage() {
    console.debug('startStorage');
    setIsDbOk(false);

    const repository = await RepositoryUtil.createFromPersistedLocalDump() as Repo;

    // @ts-ignore
    const sqldb = repository.db;

    repository.params = new ParametrosRepository(sqldb);
    repository.metas = new MetasRepository(sqldb);
    repository.notas = new NotasRepository(sqldb);
    repository.transacoes = new TransacoesRepository(sqldb);
    repository.patrimonio = new PatrimonioRepository(sqldb);
    repository.categoriaTransacoes = await CategoriaTransacoesRepository.create(sqldb);

    setRepository(repository);
    setIsDbOk(true);
    console.debug('startStorage isDbOk');

    return repository;
  }

  async function refresh() {
    return new Promise<void>(resolve => {
      console.debug('refresh');
      setIsDbOk(false);

      setTimeout(() => {
        setIsDbOk(true);
        console.debug('refresh isDbOk');
        resolve();
      }, 100);
    })
  }

  async function reload() {
    console.debug('starting reload where need');

    if (!repository) {
      console.warn('repository not initialized');
      return;
    }

    await repository.categoriaTransacoes.loadAll();
    await loadRefreshTokenIfExistsAndSetIfNeed();
  }

  async function loadRefreshTokenIfExistsAndSetIfNeed() {
    console.debug('loadRefreshTokenIfExistsAndSetIfNeed');

    const { success, refreshToken } = await loadRefreshIfExists();

    if (success && refreshToken) {
      await repository.params.set(GOOGLE_DRIVE_REFRESH_TOKEN, refreshToken);
      console.debug('Refresh token loaded and set from auth.');
      return;
    }

    console.debug('No valid refresh token found in auth, checking db...');
    const dbToken = await repository.params.getByKey(GOOGLE_DRIVE_REFRESH_TOKEN);

    if (dbToken?.valor) {
      console.debug('Found refresh token in db, setting it in auth...');
      const { success } = await loadRefreshIfExists(dbToken.valor);

      if (!success) {
        console.warn('Failed to load refresh token from db, clearing it...');
        await repository.params.set(GOOGLE_DRIVE_REFRESH_TOKEN, undefined);
      }
    } else {
      console.debug('No valid refresh token found in db, clearing it...');
      await repository.params.set(GOOGLE_DRIVE_REFRESH_TOKEN, undefined);

      if (AuthUtil.isAuthOk()) {
        NotificationUtil.send('Nenhum token de autenticação encontrado. Por favor, faça logout e login novamente no Google Drive.');
      }
    }
  }

  async function exportOriginalDumpToFileAndDownload(fileName: string) {
    const dump = await repository.exportOriginalDump();
    const blob = new Blob([dump], { type: "application/octet-stream" });

    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);

    link.download = fileName;
    link.click();
  }

  async function importOriginalDumpFromFile(file: File) {
    await Promise.resolve();

    if (file == null) {
      NotificationUtil.send('Precisa escolher o arquivo primeiro');
    } else {
      const fileReader = new FileReader();

      fileReader.onload = async function () {
        if (fileReader.result == null || typeof (fileReader.result) === 'string')
          return NotificationUtil.send('arquivo invalido')

        const data = new Uint8Array(fileReader.result);

        console.debug('importOriginalDumpFromFile data length:', data.length);

        const dataBlob = new Blob([data], { type: "application/octet-stream" });

        await RepositoryUtil.persistLocalDump(dataBlob);
        await startStorage();
      }

      fileReader.readAsArrayBuffer(file);
    }
  }

  async function doGDriveSave() {
    if (!window.confirm('Você tem certeza que deseja salvar no drive?'))
      return;

    setIsGDriveSaveLoading(true);
    console.debug('doGDriveSave start');

    if (!isAuthOk)
      throw new Error('you must login on gdrive')

    try {
      await updateGDrive();

      NotificationUtil.send('Dados salvos no Google Drive');
    } catch (ex) {
      console.error('doGDriveSave error:', ex);

      NotificationUtil.send('Erro ao salvar dados no Google Drive.');
    }

    console.debug('doGDriveSave end');
    setIsGDriveSaveLoading(false);
  }

  async function doGDriveLoad() {
    if (!window.confirm('Você tem certeza que deseja carregar do drive?'))
      return;

    setIsGDriveLoadLoading(true);
    console.debug('doGDriveLoad start');

    if (!isAuthOk)
      throw new Error('you must login on gdrive')

    const file = await loadGDrive();
    console.debug('doGDriveLoad end');
    await refresh();

    if (file)
      NotificationUtil.send('Dados carregados do Google Drive.');
    else
      NotificationUtil.send('Nenhum arquivo encontrado no Google Drive.');

    setIsGDriveLoadLoading(false);
  }

  async function loadGDrive() {
    console.debug('loadGDrive');

    const file = await GDriveUtil.getFirstFileByName(GDriveUtil.DB_FILE_NAME);

    console.debug("file", file);

    if (file) {
      const fileData = await GDriveUtil.getFileById(file.id);
      // check if fileDataBlob is a base64 string
      const dump = await RepositoryUtil.parseFromBase64OrDefault(fileData);

      await RepositoryUtil.persistLocalDump(dump);
      await startStorage()
    }

    return file;
  }

  async function updateGDrive() {
    const dump = await RepositoryUtil.exportLocalDump();

    console.debug('updateGDrive');

    const file = await GDriveUtil.getFirstFileByName(GDriveUtil.DB_FILE_NAME);

    if (file) {
      await GDriveUtil.updateFile(file.id, dump);
    } else {
      await GDriveUtil.createFile(GDriveUtil.DB_FILE_NAME, dump);
    }

    return file;
  }

  return (
    <StorageContext.Provider
      value={{
        repository,
        refresh,
        isDbOk,
        isGDriveSaveLoading,
        isGDriveLoadLoading,
        doGDriveSave,
        doGDriveLoad,
        exportOriginalDumpToFileAndDownload,
        importOriginalDumpFromFile,
      }}
      {...props} />
  )
}

export const useStorage = () => React.useContext(StorageContext)
