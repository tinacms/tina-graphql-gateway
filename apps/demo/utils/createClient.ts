import { ForestryClient } from "@forestryio/client";

export const createClient = (editMode: boolean) => {
  const options = editMode ? {
    gqlServer: `http://localhost:3003/github/${process.env.SITE_CLIENT_ID}`,
  } : {
    
  }
  
  return new ForestryClient(process.env.SITE_CLIENT_ID, options);
}