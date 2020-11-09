import React from "react";
import { AppProps } from "next/app";
import Link from "next/link";
import { withTina } from "tinacms";
import { TinacmsForestryProvider, ForestryClient } from "@forestryio/client";
import { EditLink } from "../components/EditLink";
import Cookies from "js-cookie";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <TinacmsForestryProvider
      onLogin={() => {
        Cookies.set("tina-editmode", "true");
        window.location.reload();
      }}
      onLogout={() => Cookies.remove("tina-editmode")}
    >
      <div>
        <div>
          <Link href="/pages">
            <a>Pages</a>
          </Link>
          <div style={{ width: "30px" }} />
          <Link href="/authors">
            <a>Authors</a>
          </Link>
          <div style={{ width: "30px" }} />
          <Link href="/posts">
            <a>Posts</a>
          </Link>
        </div>
        <Component {...pageProps} />
        <EditLink />
      </div>
    </TinacmsForestryProvider>
  );
}

const client = new ForestryClient(process.env.SITE_CLIENT_ID);
export default withTina(MyApp, {
  apis: {
    forestry: client,
  },
  sidebar: !!Cookies.get("tina-editmode"),
  enabled: !!Cookies.get("tina-editmode"),
});
