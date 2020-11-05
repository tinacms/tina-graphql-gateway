import { ForestryClient } from "@forestryio/client";

export const createClient = (editMode: boolean) => {
  const options = editMode ? {
    gqlServer: `http://localhost:3003/github/${process.env.SITE_CLIENT_ID}`,
  } : {
    // use the default for local files
  }
  
  return new ForestryClient(process.env.SITE_CLIENT_ID, options);
}