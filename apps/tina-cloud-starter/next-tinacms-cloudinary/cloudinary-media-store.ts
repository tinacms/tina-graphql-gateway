/**
Copyright 2021 Forestry.io Holdings, Inc.
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
    http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

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

  constructor(public cloud_name: string) {
    this.api = new Cloudinary({
      cloud_name: this.cloud_name,
      secure: true,
    })
  }

  async persist(media: MediaUploadOptions[]): Promise<Media[]> {
    const url = `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`

    // for (let item of media) {
    //   const params = {
    //     // folder: item.directory,
    //     // filename: item.file.name,
    //     // use_filename: true,
    //     // overwrite: false,
    //     public_id: (item.directory + "/" + item.file.name),
    //   };
    //   const res = await fetch(
    //     // is this save?
    //     `/api/cloudinary/sig?params=${JSON.stringify(params)}`
    //   );
    //   const { signature, timestamp } = await res.json();
    //   console.log(signature);
    //   console.log(timestamp);
    //   console.log(process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY);
    //   const formData = new FormData();
    //   formData.append("file", item.file);
    //   formData.append("api_key", process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY);
    //   formData.append("timestamp", timestamp);
    //   formData.append("signature", signature);
    //   // append keys in params obj
    //   for (let key of Object.keys(params)) {
    //     console.log(key, params[key]);
    //     formData.append(key, params[key]);
    //   }

    //   const uploadRes = await fetch(url, {
    //     method: "POST",
    //     body: formData,
    //   });
    //   console.log({ test: await uploadRes.text() });
    // }
    // await Promise.all(
    // media.map((media) => {
    //   formData.append("file", media.file);
    //   formData.append("api_key", process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY);
    //   formData.append("timestamp", timestamp);
    //   formData.append("signature", signature);

    //   return fetch(url, {
    //     method: "POST",
    //     body: formData,
    //   });
    // })
    // );

    // TODO: Fix only one file upload
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
    console.log('this is a test')
    // console.log(await res.text());
    const fileRes = await res.json()
    console.log({ fileRes })

    // TODO: be programmer
    // NOTE: why do we need this?
    await new Promise((resolve) => {
      setTimeout(resolve, 2000)
    })
    // const mediaReturn: Media = {
    //   directory: directory,
    //   filename: fileRes.public_id,
    //   id: fileRes.public_id,
    //   type: "file",
    //   previewSrc: fileRes.secure_url,
    // };
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
      items: items.map((item) => {
        console.log({ item })
        // NOT SURE WHY WE WERE DOING THIS, BUT THIS SEEMED TO HAVE BEEN CAUSING THE POOR RESOLUTION FOR THE IMAGE
        // let previewSrc: string;
        // console.log(item)
        // if (item.type === "file") {
        //   previewSrc = this.api.url(item.id, {
        //     width: 56,
        //     height: 56,
        //     crop: "fill",
        //     gravity: "auto",
        //   });
        // }

        // return {
        //   ...item,
        //   previewSrc,
        // };
        return item
      }),
      totalCount: items.length,
      limit: 500,
      offset: 0,
      nextOffset: undefined,
    }
  }
  previewSrc(publicId: string) {
    return this.api.url(publicId)
  }
}
