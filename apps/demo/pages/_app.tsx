import React from "react";
import { AppProps } from "next/app";
import { withTina } from "tinacms";
import { ForestryClient } from "@forestryio/client";
import config from "../.forestry/config";

function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}

export default withTina(MyApp, {
  apis: {
    forestry: new ForestryClient({
      serverURL: config.serverURL,
    }),
  },
});
