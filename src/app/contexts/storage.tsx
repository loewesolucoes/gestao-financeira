"use client";


import React, { createContext, useState, useEffect } from "react"
import { useAuth } from "./auth";
import { GDriveUtil } from "../utils/gdrive";
import { RepositoryUtil } from "../utils/repository";
import { DefaultRepository } from "../repositories/default";
import { ParametrosRepository } from "../repositories/parametros";
import { NotificationUtil } from "../utils/notification";
import { MetasRepository } from "../repositories/metas";
import { NotasRepository } from "../repositories/notas";
import { TransacoesRepository } from "../repositories/transacoes";
import { PatrimonioRepository } from "../repositories/patrimonio";

interface Repo extends DefaultRepository {
  params: ParametrosRepository
  metas: MetasRepository
  notas: NotasRepository
  transacoes: TransacoesRepository
  patrimonio: PatrimonioRepository
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
  const { isAuthOk } = useAuth();

  useEffect(() => {
    startStorage();
  }, []);

  async function startStorage(data?: ArrayLike<number> | Buffer | null) {
    console.debug('startStorage');
    setIsDbOk(false);

    const repository = await RepositoryUtil.create(data) as Repo;

    // @ts-ignore
    const sqldb = repository.db;

    repository.params = new ParametrosRepository(sqldb);
    repository.metas = new MetasRepository(sqldb);
    repository.notas = new NotasRepository(sqldb);
    repository.transacoes = new TransacoesRepository(sqldb);
    repository.patrimonio = new PatrimonioRepository(sqldb);

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

  async function exportOriginalDumpToFileAndDownload(fileName: string) {
    const dump = await repository.exportOriginalDump();
    const blob = new Blob([dump], { type: "application/vnd.sqlite3" });

    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);

    link.download = fileName;
    link.click();
  }

  async function importOriginalDumpFromFile(file: File) {
    await Promise.resolve();

    if (file == null) {
      alert('Precisa escolher o arquivo primeiro');
    } else {
      const fileReader = new FileReader();

      fileReader.onload = async function () {
        if (fileReader.result == null || typeof (fileReader.result) === 'string')
          return alert('arquivo invalido')

        const data = new Uint8Array(fileReader.result);
        const repo = await startStorage(data);

        repo.persistDb();
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
      const dump = fileData?.body;

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
