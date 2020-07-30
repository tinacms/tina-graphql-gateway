import React from "react";
import { AppProps } from "next/app";
import Link from "next/link";
import { withTina } from "tinacms";
import { ForestryClient } from "@forestryio/client";
import config from "../.forestry/config";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <div>
      <div style={{ display: "flex" }}>
        <Link href="/pages/home">
          <a>Pages - Home</a>
        </Link>
        <div style={{ width: "30px" }} />
        <Link href="/authors/chris">
          <a>Authors - Chris</a>
        </Link>
        <div style={{ width: "30px" }} />
        <Link href="/posts/welcome">
          <a>Posts - Welcome</a>
        </Link>
      </div>
      <Component {...pageProps} />
    </div>
  );
}

export default withTina(MyApp, {
  apis: {
    forestry: new ForestryClient({
      serverURL: config.serverURL,
    }),
  },
  sidebar: { position: "displace" },
  enabled: true,
});
