/**
Copyright 2021 Forestry.io Inc
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

import React from "react";
import { AppProps } from "next/app";
import Head from "next/head";
import { withTina } from "tinacms";
import { TinaCloudProvider } from "tina-graphql-gateway";
import { EditLink } from "../components/EditLink";
import Cookies from "js-cookie";
import { createClient } from "../utils/createClient";
import "graphiql/graphiql.css";
import "codemirror/lib/codemirror.css";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <TinaCloudProvider
      // @ts-ignore
      onLogin={() => {
        Cookies.set("tina-editmode", "true");
        window.location.reload();
      }}
      onLogout={() => Cookies.remove("tina-editmode")}
    >
      <Head>
        <link
          href="https://unpkg.com/tailwindcss@^2/dist/tailwind.min.css"
          rel="stylesheet"
        />
      </Head>
      <div>
        <Component {...pageProps} />
        <EditLink />
      </div>
    </TinaCloudProvider>
  );
}

const client = createClient(false);

export default withTina(MyApp, {
  apis: {
    tina: client,
  },
  sidebar: true, //editMode,
  enabled: true, //editMode,
});
