import { CloudinaryMediaStore } from './cloudinary-media-store'
import { Client } from 'tina-graphql-gateway'
export class TinaCLoudCloudinaryMediaStore extends CloudinaryMediaStore {
  client: any
  constructor(client: Client) {
    super()
    this.client = client
    console.log('child class')
    this.fetchFunction = async (input: RequestInfo, init?: RequestInit) => {
      try {
        const url = input.toString()
        const query = `${url.includes('?') ? '&' : '?'}org=${
          client.organizationId
        }&clientID=${client.clientId}`

        const res = client.fetchWithToken(url + query, init)
        return res
      } catch (error) {
        console.error(error)
      }
    }
  }
}
