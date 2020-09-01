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

export const FORESTRY_AUTH_CODE_KEY = "forestry_auth_code";
const SITE_REDIRECT_URI = "http://localhost:2999/authenticating";

//TODO - generate this dynamically
const codeVerifier =
  "80cJ-JMyS0ZAX2ihuBVZ8MbowHJnM8q7WpmN5VshSMfGmYT5m9gS6elXgvjJhHb~Z7U6Ja1yw.6kqwKpmsBoNmx.d3o2G7WLct7fV6vmwrBBuPndQ19dFmSeVw-5t5Aq";
const codeChallenge = "HV5Z5_1OL6rIGBI0XDwKVbN7PXvOmxRxnf-p5nvwe5s";
const randomState = () => {
  let state = "";
  let possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 40; i++)
    state += possible.charAt(Math.floor(Math.random() * possible.length));
  return state;
};

export const useGenerator = () => {
  return {
    state: randomState(),
    codeChallenge,
    codeVerifier,
  };
};

export const authenticate = (clientId: string): Promise<void> => {
  const { state, codeChallenge, codeVerifier } = useGenerator();

  const signInUrl = new URL(`http://localhost:4444/oauth2/auth`);
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
      if (e.key == FORESTRY_AUTH_CODE_KEY) {
        const config = JSON.parse(e.newValue);
        let formData = new FormData();
        formData.append("grant_type", "authorization_code");
        formData.append("client_id", process.env.REACT_APP_CLIENT_ID || "");
        formData.append(
          "redirect_uri",
          process.env.REACT_APP_REDIRECT_URI || ""
        );
        formData.append("code", config.code);
        formData.append("code_verifier", codeVerifier);

        fetch(
          `${process.env.REACT_APP_OAUTH_HOST}${process.env.REACT_APP_TOKEN_PATH}`,
          {
            method: "POST",
            headers: {
              Accept: "application/json",
              // 'Content-Type': 'application/x-www-form-urlencoded', // FOR SOME REASON INCLUDING THIS RUINS EVERYTHING
            },
            body: formData,
          }
        )
          .then((response) => response.json())
          .then((json) => {
            const token = JSON.stringify(json, null, 2);
            setCookie("tinacms-auth", token, 7);
            resolve();
          });
      }
    });
    authTab = popupWindow(signInUrl.href, "_blank", window, 1000, 700);
  });
};

function setCookie(name: string, value: string, days: number) {
  let expires = "";
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + (value || "") + expires + "; path=/";
}
