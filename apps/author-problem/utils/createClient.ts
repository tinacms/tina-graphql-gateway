import { ForestryClient } from "@forestryio/client";

export const createClient = (editMode: boolean) => {
  return new ForestryClient(
    process.env.SITE_CLIENT_ID,
    editMode
      ? {
          gqlServer: `https://content.tinajs.dev/github/jeffs/${process.env.SITE_CLIENT_ID}`,
          identityHost: "https://identity.tinajs.dev",
          oauthHost: "https://hydra.tinajs.dev:4444",
          redirectURI: "http://localhost:2999/authenticating",
        }
      : {
          identityHost: "https://identity.tinajs.dev",
          oauthHost: "https://hydra.tinajs.dev:4444",
          redirectURI: "http://localhost:2999/authenticating",
        }
  );
};
