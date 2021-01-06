import {
  ForestryClient,
  DEFAULT_LOCAL_TINA_GQL_SERVER_URL,
} from "@forestryio/client";

export const createClient = (editMode: boolean) => {
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  const customAPI = process.env.DEPLOYED_URL
    ? `${protocol}://${process.env.DEPLOYED_URL}/api/graphql`
    : "http://localhost:2999/api/graphql";

  console.log("capi", customAPI);
  return new ForestryClient({
    realm: "",
    clientId: process.env.SITE_CLIENT_ID,
    redirectURI: "",
    // customAPI: !editMode ? DEFAULT_LOCAL_TINA_GQL_SERVER_URL : undefined
    customAPI,
  });
};
