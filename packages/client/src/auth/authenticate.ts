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
export const authenticate = (clientId: string): Promise<void> => {
  const authState = Math.random().toString(36).substring(7);

  const url = `http://localhost:4444/oauth2/auth?client_id=${clientId}&redirect_uri=http%3A%2F%2Flocalhost%3A3003%2Fapi%2Fcallback&response_type=code&state=${authState}`;

  //`http://localhost:3000/login/oauth/authorize?client_id=${clientId}&state=${authState}`;

  return new Promise((resolve) => {
    // @ts-ignore
    let authTab: Window | undefined;
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
    authTab = popupWindow(url, "_blank", window, 1000, 700);
  });
};
