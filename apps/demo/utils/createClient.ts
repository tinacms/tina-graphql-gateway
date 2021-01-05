import {
  ForestryClient,
  DEFAULT_LOCAL_TINA_GQL_SERVER_URL,
} from "@forestryio/client";

export const createClient = (customAPI: string, editMode: boolean) => {
  return new ForestryClient({
    realm: "",
    clientId: process.env.SITE_CLIENT_ID,
    redirectURI: "",
    // customAPI: !editMode ? DEFAULT_LOCAL_TINA_GQL_SERVER_URL : undefined
    // customAPI: "http://localhost:2999/api/graphql",
    customAPI: customAPI,
  });
};
