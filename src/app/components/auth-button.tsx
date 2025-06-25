"use client";
import { useAuth } from "../contexts/auth";
import { useStorage } from "../contexts/storage";
import { Loader } from "./loader";

export function AuthButton() {
  const { goToAuth, doLogout, isLoadingAuth, isAuthOk } = useAuth();
  const { isGDriveLoadLoading, isGDriveSaveLoading } = useStorage();

  if (isAuthOk)
    return (
      <div className="auth-button d-flex justify-content-center mb-lg-0 mb-2">
        {isGDriveLoadLoading || isGDriveSaveLoading
          ? (
            <Loader />
          )
          : (
            <>
              <LoadGDriveButton />
              <SaveGDriveButton />
              <button className="btn btn-outline-success btn-sm me-2" type="button" onClick={doLogout}>Sair</button>
            </>
          )}
      </div>
    );

  else
    return isLoadingAuth ? <Loader className="text-success" /> : <button className="btn btn-outline-success" type="button" onClick={goToAuth}>Entrar</button>;
}

function LoadGDriveButton() {
  const { isGDriveLoadLoading, doGDriveLoad } = useStorage();

  return (
    <button className="btn btn-outline-success btn-sm me-2" type="button" onClick={doGDriveLoad} disabled={isGDriveLoadLoading}>
      Carregar do drive
    </button>
  );
}

function SaveGDriveButton() {
  const { isGDriveSaveLoading, doGDriveSave } = useStorage();

  return (
    <button className="btn btn-outline-success btn-sm me-2" type="button" onClick={doGDriveSave} disabled={isGDriveSaveLoading}>
      Salvar no drive
    </button>
  );
}
