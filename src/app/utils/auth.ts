import Cookies from 'js-cookie'
import localforage from 'localforage';
import moment from 'moment';

const GDRIVE_COOKIE_NAME = 'gdriveauth';
const GDRIVE_REFRESH_TOKEN_KEY = 'gdrive_refresh_token';

export class AuthUtil {
  public static isAuthOk(): boolean {
    return Cookies.get(GDRIVE_COOKIE_NAME) !== undefined;
  }

  public static getAuthToken(): string | undefined {
    return Cookies.get(GDRIVE_COOKIE_NAME);
  }

  public static setAuthToken(token: string, expiresIn: number) {
    const expirationDate = moment().add(expiresIn, 'seconds').toDate();

    Cookies.set(GDRIVE_COOKIE_NAME, token, {
      expires: expirationDate,
      secure: true,
      sameSite: 'Strict',
    });
  }

  public static clearAuthToken(): void {
    Cookies.remove(GDRIVE_COOKIE_NAME);
  }

  public static async getRefreshToken(): Promise<string | null> {
    return await localforage.getItem(GDRIVE_REFRESH_TOKEN_KEY);
  }

  public static async setRefreshTokenIfNeed(token: string): Promise<void> {
    if (!token || typeof token !== 'string' || token.length === 0) {
      console.warn("Invalid token provided, not setting refresh token.");
      return;
    }

    await localforage.setItem(GDRIVE_REFRESH_TOKEN_KEY, token);
  }

  public static async clearRefreshToken(): Promise<void> {
    return localforage.removeItem(GDRIVE_REFRESH_TOKEN_KEY);
  }
}
