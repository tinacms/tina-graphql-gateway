import React, { useState, useEffect } from 'react';
import { ForestryClient, TinacmsForestryProvider } from "@forestryio/client"
import {Query, Home_Data} from "../.tina/types"
import Cookies from "js-cookie";
import { Home } from './Home';
import { withTina } from "tinacms";
const client = new ForestryClient("8357445d-8957-4a0e-a932-9f209e07cc11w")

function App() {

  const [content,setContent] = useState<Home_Data | undefined>()

  useEffect(() => {
    const run = async () => {
      const content = await client.getContentForSection<Query>({relativePath: "home.md", section: "pages"})
        setContent(content?.document?.node?.data || undefined)
    }
    run()
  },[])

  return (
    <TinacmsForestryProvider
      onLogin={() => {
        Cookies.set("tina-editmode", "true");
        window.location.reload();
      }}
      onLogout={() => Cookies.remove("tina-editmode")}
    >
      {content && <Home content={content} />}
    </TinacmsForestryProvider>
  );
}

export default withTina(App, {
  apis: {
    forestry: client,
  },
  sidebar: !!Cookies.get("tina-editmode"),
  enabled: !!Cookies.get("tina-editmode"),
});
