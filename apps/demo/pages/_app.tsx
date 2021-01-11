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
