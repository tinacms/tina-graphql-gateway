import React, { useState, useEffect } from 'react';
import { ForestryClient, TinacmsForestryProvider, useTinaAuthRedirect } from "@forestryio/client"
import {Query, Home_Data} from "../.tina/types"
import Cookies from "js-cookie";
import { Home } from './Home';
import { TinaCMS, withTina, TinaProvider, useCMS } from "tinacms";
const realm = "awko"
const clientId = "5d782fa2-f6dc-4515-87f8-ac95f271ce42"
const contentAPI = `http://localhost:3003/github/${realm}/${clientId}`


function _App() {
  useTinaAuthRedirect();

  const [content,setContent] = useState<Home_Data | undefined>()
  const cms = useCMS()

  useEffect(() => {
    const run = async () => {
      const content = await (cms.api.forestry as ForestryClient).getContentForSection<Query>({relativePath: "home.md", section: "pages"})
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


export default function App ()  {
  const cms = new TinaCMS({
    apis: {
      forestry: new ForestryClient(clientId, !!Cookies.get("tina-editmode") ? {
        gqlServer: contentAPI,
        redirectURI: 'http://localhost:3007'
      }: {redirectURI: 'http://localhost:3007'}),
    },
    sidebar: !!Cookies.get("tina-editmode"),
    enabled: !!Cookies.get("tina-editmode"),
  })

  return (<TinaProvider cms={cms}>
    <_App />
  </TinaProvider>)
}