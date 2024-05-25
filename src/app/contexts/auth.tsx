"use client";

import Cookies from 'js-cookie'
import moment from 'moment';
import Script from 'next/script';
import React, { createContext, useState, useEffect } from "react"

const AuthContext = createContext({
  doAuth: () => { },
  doLogout: () => { },
  isLoadingAuth: true,
  isAuthOk: false,
  authError: null,
})

// TODO(developer): Set to client ID and API key from the Developer Console
const CLIENT_ID = process.env.NEXT_PUBLIC_CLIENT_ID || '';
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || '';

if (!CLIENT_ID || !API_KEY)
  throw new Error("You must set env variables")

// Discovery doc URL for APIs used by the quickstart
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
const SCOPES = 'https://www.googleapis.com/auth/drive';
const COOKIE_NAME = 'gdriveauth';

let tokenClient: any;
let isApiLoaded = false;
let isClientLoaded = false;

export function AuthProvider(props: any) {
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isAuthOk, setIsAuthOk] = useState(false);
  const [isLoadingGapi, setIsLoadingGapi] = useState(true);
  const [isLoadingGis, setIsLoadingGis] = useState(true);
  const [authError, setAuthError] = useState<any>(null);
  const [gload, setGLoad] = useState({ api: isApiLoaded, client: isClientLoaded });

  useEffect(() => {
    if (gload.api && gload.client) {
      createGDrive();
      isApiLoaded = isClientLoaded = true;
    }
  }, [gload]);

  useEffect(() => {
    if (!isLoadingGapi && !isLoadingGis) {
      loadTokenIfExists();
      setIsLoadingAuth(false);
    }
  }, [isLoadingGapi, isLoadingGis]);

  function loadTokenIfExists() {
    const token = Cookies.get(COOKIE_NAME);

    if (token) {
      gapi.client.setToken({ access_token: token });
      setIsAuthOk(true);
    }
  }

  function createGDrive() {
    console.info("createGDrive");

    try {
      gisLoaded();
      gapi.load('client', initializeGapiClient);
    } catch (ex) {
      console.error('Provavel sem internet.', ex)
      setAuthError(ex);
    }
  }


  /**
   * Callback after the API client is loaded. Loads the
   * discovery doc to initialize the API.
  */
  async function initializeGapiClient() {
    console.info("initializeGapiClient");

    await gapi.client.init({
      apiKey: API_KEY,
      discoveryDocs: [DISCOVERY_DOC],
    });
    setIsLoadingGapi(false);
  }

  /**
   * Callback after Google Identity Services are loaded.
  */
  function gisLoaded() {
    console.info("gisLoaded");

    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: () => console.warn('not defined'), // defined later
    });
    setIsLoadingGis(false);
  }

  /**
   *  Sign in the user upon button click.
  */
  function doAuth() {
    console.info("doAuth");

    tokenClient.callback = async (resp: any) => {
      console.info('doAuth resp', resp)
      if (resp.error !== undefined) {
        throw (resp);
      }
      setIsAuthOk(true);

      const token = gapi.client.getToken();

      Cookies.set(COOKIE_NAME, token.access_token, { expires: moment().add(token.expires_in, 's').toDate() });
    };

    if (gapi.client.getToken() === null) {
      // Prompt the user to select a Google Account and ask for consent to share their data
      // when establishing a new session.
      tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
      // Skip display of account chooser and consent dialog for an existing session.
      tokenClient.requestAccessToken({ prompt: '' });
    }
  }

  /**
   *  Sign out the user upon button click.
  */
  function doLogout() {
    console.info("doLogout");

    const token = gapi.client.getToken();

    setIsAuthOk(false);

    if (token !== null) {
      google.accounts.oauth2.revoke(token.access_token, () => console.info('end logout'));
      gapi.client.setToken(null);
      Cookies.remove(COOKIE_NAME);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        doAuth,
        doLogout,
        isLoadingAuth,
        isAuthOk,
        authError,
      }}
      {...props}
    >
      {props.children}
      <Script async defer src="https://apis.google.com/js/api.js" strategy="afterInteractive" onLoad={() => setGLoad((p) => ({ ...p, api: true }))} />
      <Script async defer src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onLoad={() => setGLoad((p) => ({ ...p, client: true }))} />
    </AuthContext.Provider>
  )
}

export const useAuth = () => React.useContext(AuthContext)