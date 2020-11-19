import React from "react";
import { AppProps } from "next/app";
import { withTina } from "tinacms";
import { TinacmsForestryProvider } from "@forestryio/client";
import Cookies from "js-cookie";
import { createClient } from "../utils/createClient";

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
        <Component {...pageProps} />
      </div>
    </TinacmsForestryProvider>
  );
}

const editMode = !!Cookies.get("tina-editmode");
const client = createClient(editMode);

export default withTina(MyApp, {
  apis: {
    forestry: client,
  },
  sidebar: true,
  enabled: true,
});
