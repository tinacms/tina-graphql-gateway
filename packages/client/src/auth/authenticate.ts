/**

Copyright 2019 Forestry.io Inc

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

*/

import popupWindow from "./popupWindow";
import { useGenerator } from "./useGenerator";

const TINA_AUTH_CONFIG = "tina_auth_config";
const SITE_REDIRECT_URI = "http://localhost:2999/authenticating";

export const authenticate = (
  clientId: string,
  oauthHost: string
): Promise<void> => {
  const { state, codeChallenge, codeVerifier } = useGenerator();

  const signInUrl = new URL(`${oauthHost}/oauth2/auth`);
  signInUrl.searchParams.append("client_id", clientId);
  signInUrl.searchParams.append("redirect_uri", SITE_REDIRECT_URI);
  signInUrl.searchParams.append("response_type", "code");
  signInUrl.searchParams.append("state", state);
  signInUrl.searchParams.append("code_challenge", codeChallenge);
  signInUrl.searchParams.append("code_challenge_method", "S256");

  return new Promise((resolve) => {
    // @ts-ignore
    let authTab: Window | undefined;

    // TODO - Grab this from the URL instead of passing through localstorage
    window.addEventListener("storage", function (e: StorageEvent) {
      if (e.key == TINA_AUTH_CONFIG) {
        const config = JSON.parse(e.newValue);
        let formData = new FormData();
        formData.append("grant_type", "authorization_code");
        formData.append("client_id", clientId);
        formData.append("redirect_uri", SITE_REDIRECT_URI);
        formData.append("code", config.code);
        formData.append("code_verifier", codeVerifier);

        fetch(`${oauthHost}/oauth2/token`, {
          method: "POST",
          headers: {
            Accept: "application/json",
            // 'Content-Type': 'application/x-www-form-urlencoded', // FOR SOME REASON INCLUDING THIS RUINS EVERYTHING
          },
          body: formData,
        })
          .then((response) => response.json())
          .then((json) => {
            const token = json.access_token;
            setCookie("tinacms-auth", token, json.expires_in);
            if (authTab) {
              authTab.close();
            }
            resolve();
          });
      }
    });
    authTab = popupWindow(signInUrl.href, "_blank", window, 1000, 700);
  });
};

function setCookie(name: string, value: string, seconds: number) {
  let expires = "";
  if (seconds) {
    const date = new Date();
    date.setTime(date.getTime() + seconds * 1000);
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + (value || "") + expires + "; path=/";
}
