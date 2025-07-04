import Cookies from 'js-cookie'
import localforage from 'localforage';
import moment from 'moment';
import { GDriveUserInfo } from './gdrive';
import { NotificationUtil } from './notification';

const GDRIVE_COOKIE_NAME = 'gdriveauth';
const GDRIVE_COOKIE_EXPIRATION_DATE = 'gdriveauthexpirationdate';
const GDRIVE_REFRESH_TOKEN_KEY = 'gdrive_refresh_token';
const GDRIVE_USER_INFO = 'user_info';

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

    Cookies.set(GDRIVE_COOKIE_EXPIRATION_DATE, expirationDate.toISOString(), {
      expires: expirationDate,
      secure: true,
      sameSite: 'Strict',
    });
  }

  public static clearAuthToken(): void {
    Cookies.remove(GDRIVE_COOKIE_NAME);
    Cookies.remove(GDRIVE_COOKIE_EXPIRATION_DATE);
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

  public static getUserInfo(): GDriveUserInfo {
    const userInfo = Cookies.get(GDRIVE_USER_INFO);

    return userInfo ? JSON.parse(userInfo) : null;
  }

  public static setUserInfo(userInfo: GDriveUserInfo): void {
    const expirationIsoDate = Cookies.get(GDRIVE_COOKIE_EXPIRATION_DATE)

    if (!expirationIsoDate) {
      NotificationUtil.send("Não foi possível salvar as informações do usuário. Tente novamente em alguns instantes ou faça logout e realize o login novamente.");

      throw new Error("Expiration date not set, cannot save user info.");
    }

    const expirationDate = new Date(expirationIsoDate);

    Cookies.set(GDRIVE_USER_INFO, JSON.stringify(userInfo), {
      expires: expirationDate,
      secure: true,
      sameSite: 'Strict',
    });
  }

  public static clearUserInfo(): void {
    Cookies.remove(GDRIVE_USER_INFO);
  }
}
