import { AuthUtil } from "./auth";

export interface GDriveFile {
  kind: string;
  mimeType: string;
  id: string;
  name: string;
}

export interface GDriveFileGet {
  result: boolean;
  body: string;
  headers: Headers;
  status: number;
  statusText: null;
}

const GOOGLE_APIS_URL = 'https://www.googleapis.com';
const GOOGLE_DRIVE_URL = `${GOOGLE_APIS_URL}/drive/v3`;
const GOOGLE_DRIVE_UPLOAD_URL = `${GOOGLE_APIS_URL}/upload/drive/v3`;

export class GDriveUtil {
  public static readonly DB_FILE_NAME = 'gestao-financeira.settings.db'
  public static async getFirstFileByName(fileName: string): Promise<GDriveFile | undefined> {
    const token = AuthUtil.getAuthToken();
    const googleAuthUrl = new URL(`${GOOGLE_DRIVE_URL}/files`)

    googleAuthUrl.searchParams.set('q', `fullText contains '"${fileName}"'`);

    const response = await fetch(googleAuthUrl.toString(), {
      method: "GET",
      headers: new Headers({
        Authorization: 'Bearer ' + token
      }),
    })

    const result = await response.json();

    return result?.files && result?.files[0] as GDriveFile | undefined;
  }

  public static async getFileById(fileId: string): Promise<Blob> {
    const token = AuthUtil.getAuthToken();

    const fileContent = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      method: "GET",
      headers: new Headers({
        Authorization: 'Bearer ' + token
      }),
    });

    return fileContent.blob();
  }

  public static async createFile(name: string, fileBlob: Blob) {
    const form = new FormData();
    const metadata = { name, mimeType: fileBlob.type || 'application/octet-stream' };

    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', fileBlob);

    const token = AuthUtil.getAuthToken();

    const response = await fetch(`${GOOGLE_DRIVE_UPLOAD_URL}/files?uploadType=multipart`, {
      method: 'POST',
      headers: new Headers({ Authorization: 'Bearer ' + token }),
      body: form
    })

    const json = await response.json()

    console.debug('Uploaded. Result:\n' + JSON.stringify(json, null, 2));

    return json;
  }

  public static async updateFile(fileId: string, fileBlob: Blob) {
    const url = `${GOOGLE_DRIVE_UPLOAD_URL}/files/${fileId}?uploadType=media`;
    const token = AuthUtil.getAuthToken();

    const response = await fetch(url, {
      method: 'PATCH',
      headers: new Headers({
        Authorization: 'Bearer ' + token,
        'Content-type': fileBlob.type || 'application/octet-stream'
      }),
      body: fileBlob
    })

    const json = await response.json()

    if (!response.ok) {
      throw new Error(`Failed to update file: ${json.error.message}`);
    }

    console.debug('Updated. Result:\n' + JSON.stringify(json, null, 2));

    return json;
  }
}