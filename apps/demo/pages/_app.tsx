import React from "react";
import App, { AppProps } from "next/app";
import Head from "next/head";
import { TinaProvider, TinaCMS } from "tinacms";
import { TinacmsForestryProvider } from "@forestryio/client";
import { EditLink } from "../components/EditLink";
import Cookies from "js-cookie";
import { createClient } from "../utils/createClient";
import "graphiql/graphiql.css";
import "codemirror/lib/codemirror.css";

export const getServerSideProps = async ({ params, ...rest }): Promise<any> => {
  if (typeof params.path === "string") {
    throw new Error("Expected an array of strings for path slugs");
  }

  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  const url = new URL("api/graphql", `${protocol}://${rest.req.headers.host}`);
  return { props: { clientURL: url.toString() } };
};

function MyApp({
  Component,
  pageProps,
  customAPI,
}: AppProps & { customAPI: string }) {
  const editMode = !!Cookies.get("tina-editmode");
  const client = createClient(customAPI, false);

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

MyApp.getInitialProps = async (appContext) => {
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  const url = new URL(
    "api/graphql",
    `${protocol}://${appContext.ctx.req.headers.host}`
  );
  const appProps = await App.getInitialProps(appContext);

  return { ...appProps, customAPI: url.toString() };
};

export default MyApp;
