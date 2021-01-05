import React from "react";
import { AppProps } from "next/app";
import Head from "next/head";
import { TinaProvider, TinaCMS } from "tinacms";
import { TinacmsForestryProvider } from "@forestryio/client";
import { EditLink } from "../components/EditLink";
import Cookies from "js-cookie";
import { createClient } from "../utils/createClient";
import "graphiql/graphiql.css";
import "codemirror/lib/codemirror.css";

const client = createClient(false);

function MyApp({ Component, pageProps }: AppProps) {
  const editMode = !!Cookies.get("tina-editmode");

  return (
    <TinaProvider
      cms={
        new TinaCMS({
          apis: {
            forestry: client,
          },
          sidebar: true, //editMode,
          enabled: true, //editMode,
        })
      }
    >
      <TinacmsForestryProvider
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
      </TinacmsForestryProvider>
    </TinaProvider>
  );
}

export default MyApp;
