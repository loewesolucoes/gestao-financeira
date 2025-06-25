"use client";

import moment from 'moment';
import React, { createContext, useState, useEffect } from "react"
import { NotificationUtil } from '../utils/notification';
import { AuthUtil } from '../utils/auth';

const AuthContext = createContext({
  goToAuth: () => { },
  doAuth: (code: string) => { },
  doLogout: () => { },
  isLoadingAuth: true,
  isAuthOk: false,
  authError: null,
})

// TODO(developer): Set to client ID and API key from the Developer Console
const CLIENT_ID = process.env.NEXT_PUBLIC_CLIENT_ID || '';
const CLIENT_SECRET = process.env.NEXT_PUBLIC_API_KEY || '';

if (!CLIENT_ID || !CLIENT_SECRET)
  throw new Error("You must set env variables")

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
const SCOPES = 'https://www.googleapis.com/auth/drive';
const GOOGLE_AUTH_BASE_URL = "https://accounts.google.com/o/oauth2/auth"
const redirectUrl = `${process.env.NEXT_PUBLIC_URL}/auth/redirect`;

export function AuthProvider(props: any) {
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isAuthOk, setIsAuthOk] = useState(false);
  const [authError, setAuthError] = useState<any>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setIsLoadingAuth(true);
    console.debug("Loading auth state...");
    loadTokenOrRefreshIfExists();
    setIsLoadingAuth(false);
  }

  async function loadTokenOrRefreshIfExists() {
    console.debug("Checking for existing token or refresh token...");
    const token = AuthUtil.getAuthToken();

    if (token) {
      console.debug("Token found, setting auth state to OK");
      setIsAuthOk(true);
    } else {
      console.debug("No token found, checking for refresh token...");
      await loadRefreshIfExists();
    }
  }

  async function loadRefreshIfExists() {
    let isOk = false;
    const refreshToken = await AuthUtil.getRefreshToken();

    if (typeof refreshToken === 'string' && refreshToken.length > 0) {
      console.debug("Refresh token found, attempting to refresh access token...");
      isOk = await doRefresh(refreshToken);
    }

    if (isOk)
      setIsAuthOk(true);
    else {
      console.debug("No valid token or refresh token found, setting auth state to not OK");
      setIsAuthOk(false);
      setAuthError("No valid token or refresh token found");
      await AuthUtil.clearRefreshToken();
      AuthUtil.clearAuthToken();
    }
  }

  function goToAuth() {
    var googleAuthUrl = new URL(GOOGLE_AUTH_BASE_URL)

    googleAuthUrl.searchParams.set('client_id', CLIENT_ID);
    googleAuthUrl.searchParams.set('redirect_uri', redirectUrl);
    googleAuthUrl.searchParams.set('response_type', 'code');
    googleAuthUrl.searchParams.set('scope', SCOPES);
    googleAuthUrl.searchParams.set('access_type', 'offline');

    window.location.href = googleAuthUrl.toString();
  }

  async function doAuth(code: string) {
    setIsLoadingAuth(true);
    const myHeaders = new Headers();

    myHeaders.append("Content-Type", "application/x-www-form-urlencoded");

    const urlencoded = new URLSearchParams();

    urlencoded.append("code", code);
    urlencoded.append("client_id", CLIENT_ID);
    urlencoded.append("client_secret", CLIENT_SECRET);
    urlencoded.append("redirect_uri", redirectUrl);
    urlencoded.append("grant_type", "authorization_code");

    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: urlencoded,
    };

    const response = await fetch("https://oauth2.googleapis.com/token", requestOptions)
    const responseData = await response.json();

    if (!response.ok) {
      console.error("Failed to authenticate:", responseData);
      setIsLoadingAuth(false);
      setAuthError(responseData.error || "Failed to authenticate");

      throw new Error(responseData.error || "Failed to authenticate");
    }

    console.debug("doAuth response:", responseData);

    await AuthUtil.setAuthToken(responseData.access_token, responseData.expires_in)
    await AuthUtil.setRefreshTokenIfNeed(responseData.refresh_token);

    setIsLoadingAuth(false);
    NotificationUtil.send("Autenticação realizada com sucesso");

    return responseData;
  }

  async function doRefresh(refresh: string) {
    const myHeaders = new Headers();

    myHeaders.append("Content-Type", "application/x-www-form-urlencoded");

    const urlencoded = new URLSearchParams();

    // https://developers.google.com/identity/protocols/oauth2/web-server#offline
    urlencoded.append("refresh_token", refresh);
    urlencoded.append("client_id", CLIENT_ID);
    urlencoded.append("client_secret", CLIENT_SECRET);
    urlencoded.append("grant_type", "refresh_token");

    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: urlencoded,
    };

    const response = await fetch("https://oauth2.googleapis.com/token", requestOptions)

    if (!response.ok)
      return false;

    const responseData = await response.json();

    await AuthUtil.setAuthToken(responseData.access_token, responseData.expires_in);

    setIsLoadingAuth(false);
    NotificationUtil.send("Autenticação realizada com sucesso");

    return responseData;
  }

  async function doLogout() {
    // revoke access token
    // https://developers.google.com/identity/protocols/oauth2/web-server#tokenrevoke
    setIsLoadingAuth(true);
    const currentToken = AuthUtil.getAuthToken();
    const revokeUrl = `https://oauth2.googleapis.com/revoke?token=${currentToken}`;
    const requestOptions = { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", }, };
    const response = await fetch(revokeUrl, requestOptions)

    if (response.ok) {
      console.debug("Access token revoked successfully");

      // Clear cookies and local storage
      AuthUtil.clearAuthToken();
      await AuthUtil.clearRefreshToken();
      setIsAuthOk(false);
      setAuthError(null);
      setIsLoadingAuth(false);
      NotificationUtil.send("Logout realizado com sucesso");
    } else {
      console.debug("Failed to revoke access token:", response, response.statusText);
      setIsLoadingAuth(false);
      setAuthError("Failed to revoke access token");
      throw new Error("Failed to revoke access token");
    }
  }

  return (
    <AuthContext.Provider
      value={{
        goToAuth,
        doAuth,
        doLogout,
        isLoadingAuth,
        isAuthOk,
        authError,
      }}
      {...props}
    >
      {props.children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => React.useContext(AuthContext)