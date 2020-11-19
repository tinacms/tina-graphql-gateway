import { ForestryClient } from "@forestryio/client";

export const createClient = (editMode: boolean) => {
  
  return new ForestryClient({
      realm: "", 
      clientId: process.env.SITE_CLIENT_ID, 
      redirectURI: "", 
      customAPI: editMode ? `http://localhost:3003/github/${process.env.REALM}/${process.env.SITE_CLIENT_ID}` : undefined
    })
}