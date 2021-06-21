import { CloudinaryMediaStore } from './cloudinary-media-store'
import { useCMS } from 'tinacms'
export class TinaCLoudCloudinaryMediaStore extends CloudinaryMediaStore {
  constructor(fetchFunction: typeof fetch) {
    console.log('child class')
    super()
    this.fetchFunction = fetchFunction
  }
}
