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
const SITE_REDIRECT_URI = "http://localhost:3002/signin/callback";

export const authenticate = (clientId: string): Promise<void> => {
  const authState =
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);

  const challenge = "todo-implement-challenge"; // TODO
  //const url = `http://localhost:3002/signin?client_id=${clientId}&redirect_uri=http%3A%2F%2Flocalhost%3A3003%2Fapi%2Fcallback&response_type=code&state=${authState}&login_challenge=${challenge}`;

  const signInUrl = new URL(`http://localhost:4444/oauth2/auth`);
  signInUrl.searchParams.append("client_id", clientId);
  signInUrl.searchParams.append("redirect_uri", SITE_REDIRECT_URI);
  signInUrl.searchParams.append("response_type", "code");
  signInUrl.searchParams.append("state", authState); // FIXME

  return new Promise((resolve) => {
    // @ts-ignore
    let authTab: Window | undefined;

    // TODO - Grab this from the URL instead of passing through localstorage
    window.addEventListener("storage", function (e: StorageEvent) {
      if (e.key == FORESTRY_AUTH_CODE_KEY) {
        //TODO - exchange token here
        console.warn("Auth token handling not yet implemented");
        // fetch(`${codeExchangeRoute}?code=${e.newValue}&state=${authState}`)
        //   .then((response) => response.json())
        //   .then((data) => {
        //     const token = data.signedToken || null;

        //     // for implementations using the csrf mitigation
        //     localStorage.setItem("tinacms-forestry-token", token);

        //     if (authTab) {
        //       authTab.close();
        //     }
        //     resolve();
        //   });
      }
    });
    authTab = popupWindow(signInUrl.href, "_blank", window, 1000, 700);
  });
};
