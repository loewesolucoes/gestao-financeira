"use client";


import React, { createContext, useState, useEffect } from "react"
import { useAuth } from "./auth";
import { GDriveUtil } from "../utils/gdrive";
import { DbRepository } from "../utils/db-repository";

interface StorageProviderContext {
  repository: DbRepository
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

export enum AvailableCollections {
  default = "default",
  simulador = "simulador",
}

export function StorageProvider(props: any) {
  const [repository, setRepository] = useState<DbRepository>({} as any);
  const [isDbOk, setIsDbOk] = useState<boolean>(false);
  const [isGDriveSaveLoading, setIsGDriveSaveLoading] = useState<boolean>(false);
  const [isGDriveLoadLoading, setIsGDriveLoadLoading] = useState<boolean>(false);
  const { isAuthOk } = useAuth();

  useEffect(() => {
    startStorage();
  }, []);

  async function startStorage(data?: ArrayLike<number> | Buffer | null) {
    console.log('startStorage');
    setIsDbOk(false);

    const repository = await DbRepository.create(data);

    setRepository(repository);
    setIsDbOk(true);
    console.log('startStorage isDbOk');

    return repository;
  }

  async function refresh() {
    return new Promise<void>(resolve => {
      console.log('refresh');
      setIsDbOk(false);

      setTimeout(() => {
        setIsDbOk(true);
        console.log('refresh isDbOk');
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
    setIsGDriveSaveLoading(true);
    console.log('doGDriveSave start');

    if (!isAuthOk)
      throw new Error('you must login on gdrive')

    updateGDrive();

    console.log('doGDriveSave end');
    setIsGDriveSaveLoading(false);
  }

  async function doGDriveLoad() {
    setIsGDriveLoadLoading(true);
    console.log('doGDriveLoad start');
    if (!isAuthOk)
      throw new Error('you must login on gdrive')

    await loadGDrive();
    console.log('doGDriveLoad end');
    await refresh();
    setIsGDriveLoadLoading(false);
  }

  async function loadGDrive() {
    console.log('loadGDrive');

    const file = await GDriveUtil.getFirstFileByName(GDriveUtil.DB_FILE_NAME);

    console.log("file", file);

    if (file) {
      const fileData = await GDriveUtil.getFileById(file.id);
      const dump = fileData?.body;

      await DbRepository.persistLocalDump(dump);
      await startStorage()
    }
  }

  async function updateGDrive() {
    const dump = await DbRepository.exportLocalDump();

    console.info('updateGDrive');

    const file = await GDriveUtil.getFirstFileByName(GDriveUtil.DB_FILE_NAME);

    if (file) {
      await GDriveUtil.updateFile(file.id, dump);
    } else {
      await GDriveUtil.createFile(GDriveUtil.DB_FILE_NAME, dump);
    }
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
