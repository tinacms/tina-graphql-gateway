import {
  MediaStore,
  MediaUploadOptions,
  Media,
  MediaListOptions,
  MediaList,
} from "@tinacms/core";

import type { Client } from "./index";

export class ForestryMediaStore implements MediaStore {
  accept = "*";

  constructor(private client: Client) {
    this.client = client;
  }

  async persist(files: MediaUploadOptions[]) {
    const uploaded: Media[] = [];

    return uploaded;
  }
  async previewSrc(src: string) {
    return src;
  }
  async list(options?: MediaListOptions): Promise<MediaList> {
    const directory = options?.directory ?? "";
    const offset = options?.offset ?? 0;
    const limit = options?.limit ?? 50;

    // console.log("get image directory list here", this.client);

    return {
      items: [],
      totalCount: 0,
      offset: 0,
      limit: 10,
      nextOffset: nextOffset(offset, limit, 3),
    };
  }
  async delete(media: Media): Promise<void> {}
}

export const nextOffset = (offset: number, limit: number, count: number) => {
  if (offset + limit < count) return offset + limit;
  return undefined;
};
