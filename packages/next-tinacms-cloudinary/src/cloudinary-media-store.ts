import { Cloudinary } from 'cloudinary-core'
import {
  Media,
  MediaList,
  MediaListOptions,
  MediaStore,
  MediaUploadOptions,
} from 'tinacms'

export class CloudinaryMediaStore implements MediaStore {
  accept = '*'
  private api: Cloudinary

  async persist(media: MediaUploadOptions[]): Promise<Media[]> {
    const { file, directory } = media[0]
    const formData = new FormData()
    formData.append('file', file)
    formData.append('directory', directory)
    formData.append('filename', file.name)

    const res = await fetch(`/api/cloudinary/media`, {
      method: 'POST',
      body: formData,
    })

    if (res.status != 200) {
      const responseData = await res.json()
      throw new Error(responseData.message)
    }
    const fileRes = await res.json()

    await new Promise((resolve) => {
      setTimeout(resolve, 2000)
    })

    return []
  }
  async delete(media: Media) {
    await fetch(`/api/cloudinary/media/${encodeURIComponent(media.id)}`, {
      method: 'DELETE',
    })
  }
  async list(options: MediaListOptions): Promise<MediaList> {
    let query = '?'

    if (options.directory) {
      query += `directory=${encodeURIComponent(options.directory)}`
    }

    const response = await fetch('/api/cloudinary/media' + query)

    const { items } = await response.json()
    return {
      items: items.map((item) => item),
      totalCount: items.length,
      limit: 500,
      offset: 0,
      nextOffset: undefined,
    }
  }

  previewSrc = (publicId: string) => publicId

  parse = (img) => img.previewSrc
}
