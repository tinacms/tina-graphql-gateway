import React from "react";
import { AppProps } from "next/app";
import { withTina } from "tinacms";

function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}

export default withTina(MyApp);
