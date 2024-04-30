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

export interface Headers {
  "cache-control": string;
  "content-encoding": string;
  "content-type": string;
  date: string;
  expires: string;
  server: string;
  vary: string;
  "x-guploader-uploadid": string;
  "Content-Type": string;
}

const mimeType = 'application/octet-stream';

export class GDriveUtil {
  public static readonly DB_FILE_NAME = 'gestao-financeira.settings.db'
  public static async getFirstFileByName(fileName: string): Promise<GDriveFile | undefined> {
    const { result } = await gapi.client.drive.files.list({ q: `fullText contains '"${fileName}"'`, });

    // @ts-ignore
    const files = result?.files;

    return files && files[0];
  }

  public static async getFileById(fileId: string): Promise<GDriveFileGet | undefined> {
    return gapi.client.drive.files.get({ fileId: fileId, alt: 'media' } as any) as any;
  }

  public static async createFile(name: string, data: any) {

    const metadata = { name, mimeType };
    const form = new FormData();

    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', data);

    const token = gapi.auth.getToken();

    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: new Headers({ Authorization: 'Bearer ' + token.access_token }),
      body: form
    })

    const json = await response.json()

    console.log('Uploaded. Result:\n' + JSON.stringify(json, null, 2));

    return json;
  }

  public static async updateFile(fileId: string, fileData: any) {
    const url = 'https://www.googleapis.com/upload/drive/v3/files/' + fileId + '?uploadType=media';
    const token = gapi.auth.getToken();

    const response = await fetch(url, {
      method: 'PATCH',
      headers: new Headers({
        Authorization: 'Bearer ' + token.access_token,
        'Content-type': mimeType
      }),
      body: fileData
    })

    const json = await response.json()

    console.log('Updated. Result:\n' + JSON.stringify(json, null, 2));
  }

  /**
   * Update an existing file's metadata and content.
  *
  * @param {String} fileId ID of the file to update.
  * @param {Object} fileMetadata existing Drive file's metadata.
  * @param {File} fileData File object to read data from.
  * @param {Function} callback Callback function to call when the request is complete.
  */
  public static updateFile_OLD(fileId: string, fileMetadata: any, fileData: Blob): Promise<any> {
    const boundary = '-------314159265358979323846';
    const delimiter = "\r\n--" + boundary + "\r\n";
    const close_delim = "\r\n--" + boundary + "--";

    return new Promise((resolve, reject) => {
      var reader = new FileReader();
      reader.readAsBinaryString(fileData);
      reader.onload = function (err) {
        if (!err)
          return reject(err);

        try {
          var contentType = fileData.type || 'application/octet-stream';
          // Updating the metadata is optional and you can instead use the value from drive.files.get.
          var base64Data = btoa(reader.result as any);
          var multipartRequestBody =
            delimiter +
            'Content-Type: application/json\r\n\r\n' +
            JSON.stringify(fileMetadata) +
            delimiter +
            'Content-Type: ' + contentType + '\r\n' +
            'Content-Transfer-Encoding: base64\r\n' +
            '\r\n' +
            base64Data +
            close_delim;

          var request = gapi.client.request({
            'path': '/upload/drive/v2/files/' + fileId,
            'method': 'PUT',
            'params': { 'uploadType': 'multipart', 'alt': 'json' },
            'headers': {
              'Content-Type': 'multipart/mixed; boundary="' + boundary + '"'
            },
            'body': multipartRequestBody
          });

          request.execute(resolve);
        } catch (ex) {
          reject(ex);
        }
      }
    });
  }
}