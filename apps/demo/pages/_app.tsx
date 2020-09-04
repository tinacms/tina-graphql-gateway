import React from "react";
import { AppProps } from "next/app";
import Link from "next/link";
import { withTina } from "tinacms";
import { ForestryClient } from "@forestryio/client";
import { TinacmsForestryProvider } from "@forestryio/client";
import { EditLink } from "../components/EditLink";
function MyApp({ Component, pageProps }: AppProps) {
  return (
    <TinacmsForestryProvider
      onLogin={() => alert("enter edit mode")}
      onLogout={() => alert("exit edit mode")}
    >
      <div>
        <div style={{ display: "flex" }}>
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

export default withTina(MyApp, {
  apis: {
    forestry: new ForestryClient(process.env.SITE_CLIENT_ID),
  },
  sidebar: { position: "displace" },
  enabled: false,
});
