import React from "react";
import { AppProps } from "next/app";
import Link from "next/link";
import { withTina } from "tinacms";
import { ForestryClient } from "@forestryio/client";

function MyApp({ Component, pageProps }: AppProps) {
  return (
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
    </div>
  );
}

export default withTina(MyApp, {
  apis: {
    forestry: new ForestryClient(),
  },
  sidebar: { position: "displace" },
  enabled: true,
});
