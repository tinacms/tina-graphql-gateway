import { ForestryClient, DEFAULT_LOCAL_TINA_GQL_SERVER_URL } from "@forestryio/client";

export const createClient = (editMode: boolean) => {

  return new ForestryClient({
      realm: "",
      clientId: process.env.SITE_CLIENT_ID,
      redirectURI: "",
      customAPI: !editMode ? DEFAULT_LOCAL_TINA_GQL_SERVER_URL : undefined
    })
}
